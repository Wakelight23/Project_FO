// src > middlewares > auth.js
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';
import dotenv from 'dotenv';

dotenv.config();

export default async function authM(req, res, next) {
  try {
    const { authorization } = req.headers;
    console.log(authorization); // 추출 확인용

    // Authorization 헤더가 없을 경우
    if (!authorization) throw new Error('토큰이 존재하지 않습니다.');

    const [tokenType, token] = authorization.split(' ');

    if (tokenType !== 'Bearer')
      throw new Error('토큰 타입이 일치하지 않습니다.');

    // 엑세스 토큰 검증
    const decodedToken = jwt.verify(token, process.env.SERVER_ACCESS_KEY);
    const accountsData = decodedToken.accountid;

    // 데이터베이스에서 사용자 정보 조회
    const accounts = await prisma.accounts.findFirst({
      where: { accountid: accountsData },
    });

    // 사용자가 존재하지 않을 경우
    if (!accounts) {
      throw new Error('토큰 사용자가 존재하지 않습니다.');
    }

    // req.accounts 사용자 정보를 저장합니다.
    req.account = accounts;
    console.log('인증된 정보 :', req.account); // 확인용
    next();
  } catch (error) {
    // 토큰이 만료되었거나, 조작되었을 때, 에러 메시지를 다르게 출력합니다.
    // switch (error.name) {
    //   case "TokenExpiredError":
    //     return res.status(401).json({ message: "토큰이 만료되었습니다." });
    //   case "JsonWebTokenError":
    //     return res.status(401).json({ message: "토큰이 조작되었습니다." });
    //   default:
    //     return res
    //       .status(401)
    //       .json({ message: error.message ?? "비정상적인 요청입니다." });
    // }
    if (error.name === 'TokenExpiredError') {
      const { authorization } = req.headers;
      const [tokenType, token] = authorization.split(' ');

      // 리프레시 토큰을 데이터베이스에서 조회
      const accountId = jwt.decode(token)?.accountid;
      const storedToken = await prisma.refreshToken.findFirst({
        where: { accountid: accountId },
      });

      // 리프레시 토큰이 존재하지 않을 경우
      if (!storedToken) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
      }

      try {
        // 리프레시 토큰 검증
        const decodedRefreshToken = jwt.verify(
          storedToken.token,
          process.env.SERVER_REFRESH_KEY
        );

        // 새로운 엑세스 토큰 생성
        const newAccessToken = jwt.sign(
          { accountid: decodedRefreshToken.account_id },
          process.env.SERVER_ACCESS_KEY,
          { expiresIn: '5m' }
        );

        return res.status(200).json({ accessToken: newAccessToken });
      } catch (refreshError) {
        return res
          .status(401)
          .json({ message: '리프레시 토큰이 만료되었거나 조작되었습니다.' });
      }
    } else {
      return res
        .status(401)
        .json({ message: error.message ?? '비정상적인 요청입니다.' });
    }
  }
}
