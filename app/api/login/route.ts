import { NextRequest, NextResponse } from "next/server";
import { LoginRequestBody } from "../../types/login-request-body";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as LoginRequestBody;

  // Return an error if the username or password is blank.
  // TODO: Check if password is valid in database.
  if (body.username == "" || body.password == "") {
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 400 },
    );
  }
  // Not sure how secure uuids are, research is recommended.
  // TODO: Register and validate session token.
  return NextResponse.json({ ok: true, token: crypto.randomUUID() });
}
