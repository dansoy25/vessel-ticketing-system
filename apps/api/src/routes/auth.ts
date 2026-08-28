import { prisma } from "@vessel/db";
import type { AuthUser } from "@vessel/shared";
import bcrypt from "bcryptjs";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const registerAuthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post("/login", { schema: { body: loginSchema } }, async (request, reply) => {
    const { username, password } = request.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return reply.unauthorized("Invalid username or password");

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) return reply.unauthorized("Invalid username or password");

    const authUser: AuthUser = { id: user.id, username: user.username, role: user.role };
    const token = app.jwt.sign(
      { sub: user.id, username: user.username, role: user.role },
      { expiresIn: "12h" },
    );

    return { token, user: authUser };
  });

  app.get("/me", { preHandler: app.authenticate }, async (request) => {
    const user = await prisma.user.findUnique({ where: { id: request.user.sub } });
    if (!user) throw app.httpErrors.unauthorized();
    const authUser: AuthUser = { id: user.id, username: user.username, role: user.role };
    return authUser;
  });
};
