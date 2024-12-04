// src > middlewares > auth.js
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';
import dotenv from 'dotenv';

dotenv.config();

export default async function authM(req, res, next) {
    try {
        const { authorization } = req.headers;
        console.log('추출 확인: ' + authorization); // 추출 확인용

        // Authorization 헤더가 없을 경우
        if (!authorization) throw new Error('토큰이 존재하지 않습니다.');

        const [tokenType, token] = authorization.split(' ');

        if (tokenType !== 'Bearer')
            throw new Error('토큰 타입이 일치하지 않습니다.');

        // 엑세스 토큰 검증
        const decodedToken = jwt.verify(token, process.env.SERVER_ACCESS_KEY);
        const accountsData = decodedToken.accountId;

        // 데이터베이스에서 사용자 정보 조회
        const accounts = await prisma.account.findFirst({
            where: { accountId: accountsData },
        });

        // 사용자가 존재하지 않을 경우
        if (!accounts) {
            throw new Error('토큰 사용자가 존재하지 않습니다.');
        }

        // req.accounts 사용자 정보를 저장합니다.
        req.account = accounts;
        res.setHeader('Authorization', `Bearer ${decodedToken}`);
        // console.log('인증된 정보 :', req.account); // 확인용
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            // 클라이언트가 전달한 엑세스 토큰이 만료된 경우
            const { 'x-info': email } = req.headers;
            const getaccountid = await prisma.account.findFirst({
                where: { email },
            });

            try {
                // 리프레시 토큰을 데이터베이스에서 조회
                const storedToken = await prisma.refreshToken.findFirst({
                    where: { accountId: getaccountid.accountId },
                });

                // 리프레시 토큰이 존재하지 않을 경우
                if (!storedToken) {
                    return res
                        .status(401)
                        .json({ message: '로그인이 필요합니다.' });
                }

                // 리프레시 토큰 검증
                const decodedRefreshToken = jwt.verify(
                    storedToken.token,
                    process.env.SERVER_REFRESH_KEY
                );

                // 검증된 리프레시토큰과 연결된 accountid를 바탕으로 새로운 엑세스 토큰 생성
                const newAccessToken = jwt.sign(
                    { accountId: decodedRefreshToken.accountId },
                    process.env.SERVER_ACCESS_KEY,
                    { expiresIn: '1m' }
                );

                // 데이터베이스에서 계정 정보 조회
                const newAccounts = await prisma.account.findFirst({
                    // 검증된 리프레시 토큰과 연계된 accounid로 계정정보 조회
                    where: { accountId: decodedRefreshToken.accountId },
                });

                //조회한 계졍정보 할당
                req.account = newAccounts;
                // console.log('인증된 정보 :', req.account); // 확인용
                res.setHeader('Authorization', `Bearer ${newAccessToken}`);
                next();
            } catch (refreshError) {
                // 리프레시 토큰이 만료된 경우
                if (refreshError.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        message:
                            '리프레시 토큰이 만료되었습니다. 다시 로그인하세요.',
                    });
                }
                return res.status(401).json({
                    message: '리프레시 토큰 검증 중 오류가 발생했습니다.',
                });
            }
        } else if (error.name === 'JsonWebTokenError') {
            // 예외
            return res.status(401).json({ message: '토큰이 조작되었습니다.' });
        } else {
            return res.status(401).json({ message: '비정상적인 요청입니다.' });
        }
    }
}
