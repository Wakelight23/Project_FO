import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";

export default async function authM(req, res, next) {
  try {
    const { authorization } = req.headers;
    console.log(authorization);
    if (!authorization) throw new Error("토큰이 존재하지 않습니다.");

    const [tokenType, token] = authorization.split(" ");

    if (tokenType !== "Bearer")
      throw new Error("토큰 타입이 일치하지 않습니다.");

    const decodedToken = jwt.verify(token, "server-secret-key");
    const accountsId = decodedToken.account_id;

    const accounts = await prisma.accounts.findFirst({
      where: { account_id: accountsId },
    });
    if (!accounts) {
      throw new Error("토큰 사용자가 존재하지 않습니다.");
    }

    // req.accounts 사용자 정보를 저장합니다.
    req.abc = accounts;
    console.log("인증된 정보 :", req.abc);
    next();
  } catch (error) {
    // 토큰이 만료되었거나, 조작되었을 때, 에러 메시지를 다르게 출력합니다.
    switch (error.name) {
      case "TokenExpiredError":
        return res.status(401).json({ message: "토큰이 만료되었습니다." });
      case "JsonWebTokenError":
        return res.status(401).json({ message: "토큰이 조작되었습니다." });
      default:
        return res
          .status(401)
          .json({ message: error.message ?? "비정상적인 요청입니다." });
    }
  }
}
