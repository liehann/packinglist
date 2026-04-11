import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export const dynamic = 'force-dynamic';

const getAuth = () => {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !key) {
    throw new Error('Missing Google Credentials in .env.local');
  }
  key = key.replace(/\\n/g, '\n');

  return new JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
};

export async function GET() {
  try {
    const auth = getAuth();
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, auth);
    
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Phloots Packing List'];
    
    if (!sheet) {
      return NextResponse.json({ error: 'Sheet "Phloots Packing List" not found.' }, { status: 404 });
    }

    const rows = await sheet.getRows();
    
    const items = rows.map((row) => ({
      id: row.rowNumber,
      category: row.get('Category') || 'Uncategorized',
      item: row.get('Item') || '',
      quantity: row.get('Quantity (per person/family)') || row.get('Quantity') || row.get('Qty') || '',
      notes: row.get('Notes') || '',
      packed: String(row.get('Packed')).toUpperCase() === 'TRUE',
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Error fetching data from Google Sheets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { rowId, packed, item, category, quantity, notes } = body;

    if (!rowId) {
      return NextResponse.json({ error: 'Missing rowId' }, { status: 400 });
    }

    const auth = getAuth();
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, auth);
    
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Phloots Packing List'];
    const rows = await sheet.getRows();
    
    const row = rows.find(r => r.rowNumber === rowId);

    if (!row) {
      return NextResponse.json({ error: 'Row not found' }, { status: 404 });
    }

    if (packed !== undefined) row.set('Packed', packed ? 'TRUE' : 'FALSE');
    if (item !== undefined) row.set('Item', item);
    if (category !== undefined) row.set('Category', category);
    if (quantity !== undefined) {
      // Best effort set depending on what header exists
      const h = sheet.headerValues;
      if (h.includes('Quantity (per person/family)')) row.set('Quantity (per person/family)', quantity);
      else if (h.includes('Quantity')) row.set('Quantity', quantity);
      else if (h.includes('Qty')) row.set('Qty', quantity);
    }
    if (notes !== undefined) row.set('Notes', notes);

    await row.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating Google Sheets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, item, quantity, notes } = body;

    const auth = getAuth();
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, auth);
    
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Phloots Packing List'];
    await sheet.loadHeaderRow();
    const h = sheet.headerValues;
    const catIdx = h.findIndex(hdr => hdr.toLowerCase() === 'category');
    const itemIdx = h.findIndex(hdr => hdr.toLowerCase() === 'item');
    const qtyIdx = h.findIndex(hdr => hdr.toLowerCase().includes('quantity') || hdr.toLowerCase() === 'qty');
    const notesIdx = h.findIndex(hdr => hdr.toLowerCase() === 'notes');
    const packedIdx = h.findIndex(hdr => hdr.toLowerCase() === 'packed');

    const maxScanRows = 500;
    const maxColIdx = Math.max(catIdx, itemIdx, qtyIdx, notesIdx, packedIdx, 0);
    
    // Load existing cells to find the first empty spot
    await sheet.loadCells({
      startRowIndex: 1, // Start from Row 2
      endRowIndex: maxScanRows,
      startColumnIndex: 0,
      endColumnIndex: maxColIdx + 1
    });

    let targetRowIndex = -1;
    for (let r = 1; r < maxScanRows; r++) {
      const isCatEmpty = !sheet.getCell(r, catIdx).value;
      const isItemEmpty = !sheet.getCell(r, itemIdx).value;
      if (isCatEmpty && isItemEmpty) {
        targetRowIndex = r;
        break;
      }
    }

    const qty = quantity || '1';
    if (targetRowIndex !== -1) {
      // Hybrid Step: Physically insert a row at the detected empty spot
      // This ensures table expansion and no empty gaps
      await sheet.insertDimension('ROWS', { startIndex: targetRowIndex, endIndex: targetRowIndex + 1 });
      
      // Load the newly inserted row's cells (since insertion shifts the grid)
      await sheet.loadCells({
        startRowIndex: targetRowIndex,
        endRowIndex: targetRowIndex + 1,
        startColumnIndex: 0,
        endColumnIndex: maxColIdx + 1
      });

      if (catIdx !== -1) sheet.getCell(targetRowIndex, catIdx).value = category || 'Uncategorized';
      if (itemIdx !== -1) sheet.getCell(targetRowIndex, itemIdx).value = item || 'New Item';
      if (qtyIdx !== -1) sheet.getCell(targetRowIndex, qtyIdx).value = qty;
      if (notesIdx !== -1) sheet.getCell(targetRowIndex, notesIdx).value = notes || '';
      if (packedIdx !== -1) sheet.getCell(targetRowIndex, packedIdx).value = 'FALSE';
      
      await sheet.saveUpdatedCells();
    } else {
      // Fallback: strictly append with insertion if no space found in first 500 rows
      const payload: any = {};
      if (catIdx !== -1) payload[h[catIdx]] = category || 'Uncategorized';
      if (itemIdx !== -1) payload[h[itemIdx]] = item || 'New Item';
      if (qtyIdx !== -1) payload[h[qtyIdx]] = qty;
      if (notesIdx !== -1) payload[h[notesIdx]] = notes || '';
      if (packedIdx !== -1) payload[h[packedIdx]] = 'FALSE';
      await sheet.addRow(payload, { insert: true });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error appending row to Google Sheets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rowId = searchParams.get('rowId');

    if (!rowId) {
      return NextResponse.json({ error: 'Missing rowId' }, { status: 400 });
    }

    const auth = getAuth();
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, auth);
    
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Phloots Packing List'];
    const rows = await sheet.getRows();
    
    const row = rows.find(r => r.rowNumber === Number(rowId));

    if (!row) {
      return NextResponse.json({ error: 'Row not found' }, { status: 404 });
    }

    await row.delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting from Google Sheets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
