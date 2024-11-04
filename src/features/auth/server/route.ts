import { z } from "zod";
import { Hono } from "hono";
import { ID } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";
import { deleteCookie, setCookie } from "hono/cookie";
import { createAdminClient } from "@/lib/appwrite";
import { loginSchema, registerSchema } from "../schemas";
import { AUTH_COOKIE } from "../constants";
import path from "path";

const app = new Hono()
  .post(
    "/login",
    zValidator("json", loginSchema),

    async (c) => {
      const { email, password } = c.req.valid("json");

      const { account } = await createAdminClient();
      const session = await account.createEmailPasswordSession(email, password);

      setCookie(c, AUTH_COOKIE, session.secret, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        maxAge: 60 * 60 * 24 * 7,
      });

      return c.json({ success: true });
    }
  )
  .post("/register", zValidator("json", registerSchema), async (c) => {
    const { name, email, password } = c.req.valid("json");
    const { account } = await createAdminClient();

    const user = await account.create(ID.unique(), email, password, name);

    const session = await account.createEmailPasswordSession(email, password);

    setCookie(c, AUTH_COOKIE, session.secret, {
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return c.json({ data: user });
  });

// .post("/logout", sessionMiddleWare, (c) => {
//   deleteCookie(c, AUTH_COOKIE);
//   return c.json({ success: true });
// });

export default app;
