import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/s3';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');

  // Verify secret
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    return NextResponse.json({ error: 'S3_BUCKET is not configured' }, { status: 500 });
  }

  try {
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: 'Database file not found' }, { status: 404 });
    }

    const buffer = fs.readFileSync(dbPath);
    
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const objectKey = `rescan/backups/dev-${date}-${Date.now()}.db`;

    await s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: buffer,
    }));

    return NextResponse.json({ success: true, file: objectKey });
  } catch (error: any) {
    console.error('Backup Error:', error);
    return NextResponse.json({ error: 'Failed to backup database' }, { status: 500 });
  }
}
