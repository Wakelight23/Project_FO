import express from 'express';
import { prisma } from '../../utils/prisma/index.js';
import dotenv from 'dotenv';
import authM from '../../middlewares/auth.js';

dotenv.config();
// character.js
const router = express.Router();

router.post('/create-manager', authM, async (req, res) => {
    // 요청 본문에서 nickname 추출
    const { nickname } = req.body;
<<<<<<< HEAD
<<<<<<< HEAD

    // authM 미들웨어에서 인증을 거친 accounts 정보를 가져오고
    // accounts에서 account_id를 추출한다

    const { accountId } = req.account;
    // const { name } = req.account;
    // const { age } = req.account;
    // const { email } = req.account;
    // const { password } = req.account;

    // 닉네임 중복 검증
    const isExistnickname = await prisma.manager.findFirst({
        where: { nickname },
    });

    if (isExistnickname) {
        return res.status(409).json({ message: '이미 존재하는 닉네임입니다.' });
    }

    // 매니저 존재 검증
    const isExistManager = await prisma.manager.findUnique({
        where: { accountId: +accountId },
    });

=======
=======
>>>>>>> ae9af60905f8ee1fe103c96701ebd2f0ed8c7ddb
    // authM 미들웨어에서 인증을 거친 accounts 정보를 가져오고
    // accounts에서 account_id를 추출한다
    const { accountId } = req.account;
    // const { name } = req.account;
    // const { age } = req.account;
    // const { email } = req.account;
    // const { password } = req.account;
    // console.log(accountid, name, age, email, password);

    // 닉네임 중복 검증
    const isExistnickname = await prisma.manager.findFirst({
        where: { nickname },
    });

    if (isExistnickname) {
        return res.status(409).json({ message: '이미 존재하는 닉네임입니다.' });
    }

    if (!/^.{1,8}$/.test(nickname)) {
        return res
            .status(409)
            .json({ message: 'nickname은 8자리 이하로만 설정할 수 있습니다' });
    }

    // 매니저 존재 검증
    const isExistManager = await prisma.manager.findUnique({
        where: { accountId: +accountId },
    });

<<<<<<< HEAD
>>>>>>> 97df264409276b681807935068d3e9d30674e944
=======
>>>>>>> ae9af60905f8ee1fe103c96701ebd2f0ed8c7ddb
    if (isExistManager) {
        return res.status(409).json({ message: '이미 매니저가 존재합니다.' });
    }

    // 캐릭터 생성 로직
    const newManager = await prisma.manager.create({
        data: {
            // 뽑아온 nickname, account_id를 각 컬럼에 적용한다.
            accountId: +accountId,
<<<<<<< HEAD
<<<<<<< HEAD

=======
>>>>>>> 97df264409276b681807935068d3e9d30674e944
=======
>>>>>>> ae9af60905f8ee1fe103c96701ebd2f0ed8c7ddb
            nickname: nickname,
            rating: 1000,
            cash: 10000,
        },
    });
    return res
        .status(201)
        .json({ message: '매니저 생성 성공', manager: newManager });
});

export default router;
