import express from 'express';
import { prisma } from '../../utils/prisma/index.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();
const router = express.Router();

/** 사용자 회원가입 API **/
// localhost:c/api/sign-up POST
router.post('/sign-up', async (req, res) => {
    console.log('회원가입 요청:', req.body);
    const { email, password, confirmPassword, name, age, gender } = req.body;
    console.log({
        email,
        password,
        confirmPassword,
        name,
        age,
        gender,
    });
    const parsedAge = parseInt(age, 10);

    // 이메일 중복 체크
    const isExistEmail = await prisma.account.findUnique({
        where: { email },
    });

    if (isExistEmail) {
        return res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
    }

    // 이메일 형식 체크
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        return res
            .status(409)
            .json({ message: '이메일 형식이 적절하지 않습니다.' });
    }

    // 비밀번호 형식 체크
    if (!/^.{1,6}$/.test(password)) {
        return res
            .status(409)
            .json({ message: 'password는 6자리 이하로만 설정할 수 있습니다' });
    }

    // 비밀번호 확인
    if (password !== confirmPassword) {
        return res.status(409).json({ message: 'password를 다시 확인하세요.' });
    }

    // 나이 유효성 체크
    if (!/^[1-9][0-9]*$/.test(parsedAge)) {
        return res
            .status(409)
            .json({ message: '나이는 1 이상의 정수여야 합니다.' });
    }

    // 성별 유효성 체크
    const validGenders = ['male', 'female'];
    if (!validGenders.includes(gender)) {
        return res
            .status(409)
            .json({ message: 'male 또는 female이어야 합니다.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 정보를 account 테이블에 추가
    const accountData = await prisma.account.create({
        data: {
            email,
            password: hashedPassword,
            name,
            age: parsedAge,
            gender,
        },
    });

    return res.status(201).json({
        message: '회원가입이 완료되었습니다.',
        accountId: accountData.accountId,
    });
});

router.post('/sign-in', async (req, res) => {
    const { email, password } = req.body;
    const accountData = await prisma.account.findFirst({ where: { email } });

    if (!accountData)
        return res.status(401).json({ message: '존재하지 않는 email입니다.' });
    // 입력받은 사용자의 비밀번호와 데이터베이스에 저장된 비밀번호를 비교합니다.
    else if (!(await bcrypt.compare(password, accountData.password)))
        return res
            .status(401)
            .json({ message: '비밀번호가 일치하지 않습니다.' });

    // 로그인에 성공하면, 사용자의 accountId를 바탕으로 토큰을 생성합니다.
    const accesstoken = jwt.sign(
        {
            accountId: accountData.accountId,
            isAdmin: accountData.isAdmin,
        },
        // JWT를 서명하는 데 사용되는 비밀 키
        // 서버가 비밀 키를 사용하여 토큰 변조 여부를 알 수 있다
        process.env.SERVER_ACCESS_KEY,
        { expiresIn: '1m' }
    );

    // 기존 리프레시 토큰 삭제
    await prisma.refreshToken.deleteMany({
        where: { accountId: accountData.accountId },
    });

    // 리프레시 토큰 생성
    const refreshtoken = jwt.sign(
        {
            accountId: accountData.accountId,
        },
        process.env.SERVER_REFRESH_KEY, // 리프레시 토큰을 위한 비밀 키
        { expiresIn: '7d' } // 예: 7일 동안 유효
    );
    // 리프레시 토큰을 토큰테이블에 저장
    // 해당 리프레시 토큰과 연결된 account_id도 함께 저장
    await prisma.refreshToken.create({
        data: {
            token: refreshtoken,
            accountId: accountData.accountId,
        },
    });

    // 매니저 정보 조회
    const managerData = await prisma.manager.findFirst({
        where: { accountId: accountData.accountId },
    });

    // 매니저 정보가 없을 경우 기본값 설정
    const managerNickname = managerData ? managerData.nickname : null; // 매니저 닉네임
    const managerCash = managerData ? managerData.cash : 0; // 매니저 보유 캐시

    res.setHeader('Authorization', `Bearer ${accesstoken}`);

    res.setHeader('x-info', accountData.email);

    return res.status(200).json({
        message: '로그인 성공',
        accessToken: accesstoken,
        email: accountData.email,
        managerNickname: managerNickname,
        managerCash: managerCash,
    });
});

export default router;
