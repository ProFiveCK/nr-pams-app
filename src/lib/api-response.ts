import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "@/lib/api-auth";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    const fields = error.issues.reduce<Record<string, string>>((acc, issue) => {
      const path = issue.path[0];
      if (typeof path === "string" && !acc[path]) {
        acc[path] = issue.message;
      }
      return acc;
    }, {});

    return NextResponse.json(
      {
        error: "Validation failed. Please review the highlighted fields.",
        fields,
      },
      { status: 400 },
    );
  }

  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
