// src/app/api/send/route.ts
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { name, contact, category, details } = await request.json();

    // 發送郵件
    const data = await resend.emails.send({
      from: 'Feeling Studio <onboarding@resend.dev>', // 驗證網域後可改用您的網域
      to: ['您的電子信箱@gmail.com'], // 接收提醒的信箱
      subject: `🔔 新詢問單：來自 ${name} 的攝影需求`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">Feeling Studio 新詢問單</h2>
          <p><strong>客戶姓名：</strong> ${name}</p>
          <p><strong>聯絡方式：</strong> ${contact}</p>
          <p><strong>需求類別：</strong> ${category}</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p><strong>詳細內容：</strong></p>
            <p style="white-space: pre-wrap;">${details}</p>
          </div>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">請登入系統後台回覆客戶。</p>
        </div>
      `,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error });
  }
}
