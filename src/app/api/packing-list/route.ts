import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

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

    await sheet.addRow({
      'Category': category || 'Uncategorized',
      'Item': item || 'New Item',
      'Quantity (per person/family)': quantity || '1',
      'Notes': notes || '',
      'Packed': 'FALSE'
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error appending row to Google Sheets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
