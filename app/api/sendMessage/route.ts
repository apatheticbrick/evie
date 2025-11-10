import { NextRequest, NextResponse } from "next/server";
import { REST } from "@discordjs/rest";

type SendMessageRequestBody = {
  message?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SendMessageRequestBody;
    const message = body?.message?.trim();

    if (!message) {
      return NextResponse.json(
        { error: "Message body is required." },
        { status: 400 },
      );
    }

    const token = process.env.DISCORD_BOT_TOKEN;
    const channelId = process.env.CHANNEL;

    //check for the necessary tokens
    if (!token || !channelId) {
      return NextResponse.json(
        { error: "Server is missing Discord configuration." },
        { status: 500 },
      );
    }

    const rest = new REST({ version: "10" }).setToken(token);

    // Discord create message: POST /channels/{channel.id}/messages
    await rest.post(`/channels/${channelId}/messages`, {
      body: { content: message },
    } as any);

    return NextResponse.json({ ok: true });
  } catch (error) {
    //returns any errors
    console.error("Failed to send Discord message", error);
    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 500 },
    );
  }
}
