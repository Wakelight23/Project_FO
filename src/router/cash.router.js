// routes/cash.router.js
import express from 'express';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

// Lucky캐시 email
router.post('/cash/lucky', async (req, res, next) => {
    const { email } = req.body;
    try {
        // email이 있는지 확인
        const isEmail = await prisma.manager.findFirst({
            where: { email: email },
            select: {
                email: true,
                cash: true,
            },
        });
        // 있으면
        if (!isEmail) {
            return res
                .status(404)
                .json({ message: '존재하지 않는 Email 입니다.' });
        }
        const giftCash = Math.floor(Math.random() * 200) + 20;

        // originalCache는 객체 형태. originalCache -> originalCache.cash
        await prisma.manager.update({
            data: { cash: isEmail.cash + giftCash },
            where: { email },
        });

        return res
            .status(200)
            .json({ message: `LUCKY!!! ${giftCash}캐시를 받았습니다.` });
    } catch (error) {
        console.error('Error lucky cash:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

///////////////////////////////////////////////////////////////////////////
// 캐시 구매 email, 캐시, pw
router.post('/cash/payment', async (req, res, next) => {
    const { email, buyCash, password } = req.body;
    if (!buyCash || buyCash <= 0) {
        return res.status(404).json({
            message: '구매하려는 캐시는 0 이상의 정수를 입력해주세요.',
        });
    }

    const isEmail = await prisma.manager.findFirst({
        where: { email: email },
        select: {
            email: true,
            cash: true,
            account: {
                select: {
                    password: true, // Account.password
                },
            },
        },
    });

    // 없으면
    if (!isEmail) {
        return res.status(404).json({ message: '존재하지 않는 Email 입니다.' });
    }
    // 비번틀리면
    if (isEmail.account.password != password) {
        return res.status(404).json({ message: '틀린 비밀번호 입니다.' });
    }

    await prisma.manager.update({
        data: { cash: isEmail.cash + buyCash },
        where: { email },
    });

    return res
        .status(200)
        .json({ message: `${buyCash}캐시를 결제하셧습니다.` });
});

/////////////////////////////////////////////
// 캐시 조회  email
router.get('/cash/:email', async (req, res, next) => {
    const { email } = req.params;
    try {
        const myCash = await prisma.manager.findFirst({
            where: { email: email },
            select: {
                nickname: true,
                cash: true,
            },
        });

        if (!myCash) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ data: myCash });
    } catch (error) {
        console.error('Error fetching cash data:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// 1. 다른 유저에게 캐시 선물
router.post('/cash/gift', async (req, res, next) => {
    const { senderNickname, receiverNickname, amount, password } = req.body;
    let newAmount = +amount;
    try {
        // 입력정보 확인
        if (!senderNickname || !receiverNickname || !newAmount || !password) {
            return res.status(404).json({
                message:
                    '보내는 닉네임, 받는 닉네임, 금액, 비밀번호를 모두 입력해주세요.',
            });
        }

        // 송신자 닉네임 확인
        const sender = await prisma.manager.findFirst({
            where: { nickname: senderNickname },
            select: {
                cash: true,
                account: {
                    select: {
                        password: true, // Account.password
                    },
                },
            },
        });
        if (!sender) {
            return res.status(404).json({
                message: '송신자 닉네임이 존재하지 않습니다.',
            });
        }

        // 송신자 비번확인
        if (sender.account.password !== password) {
            return res.status(404).json({
                message: '송신자의 비밀번호가 일치하지 않습니다.',
            });
        }

        // 수신자 닉네임 확인
        const receiver = await prisma.manager.findFirst({
            where: { nickname: receiverNickname },
            select: {
                cash: true,
            },
        });

        if (!receiver) {
            return res.status(404).json({
                message: '수신자 닉네임이 존재하지 않습니다.',
            });
        }

        // 캐시 1이상의 정수 확인
        if (!Number.isInteger(newAmount) || newAmount < 1) {
            return res.status(404).json({
                message: '선물하는 금액은 1 이상의 정수여야 합니다.',
            });
        }
        // 송신자 잔액 확인
        if (sender.cash < newAmount) {
            return res.status(400).json({
                message: '송신자의 잔액이 부족합니다.',
            });
        }

        // 캐시 수정하기  내꺼 줄어들고 받은사람 늘어나고
        await prisma.manager.update({
            where: { nickname: senderNickname },
            data: { cash: sender.cash - newAmount },
        });
        await prisma.manager.update({
            where: { nickname: receiverNickname },
            data: { cash: receiver.cash + newAmount },
        });

        // 수신 알림 저장 <- 알림용 테이블을 만들어야함
        // await prisma.notification.create({
        //     data: {
        //         receiverNickname,
        //         message: `${senderNickname}님이 ${newAmount}캐시를 선물하였습니다.`,
        //         createdAt: new Date(),
        //     },
        // });

        return res.status(200).json({
            message: `${receiverNickname}님에게 ${newAmount}캐시를 선물했습니다.`,
        });
    } catch (error) {
        console.error('Error gifting cash:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// 2. 돈 불리기 ( 행운의 룰렛)
router.post('/cash/roulette', async (req, res, next) => {
    const { email, betAmount, password } = req.body;
    try {
        // 입력정보 유효성 확인
        const bet = await prisma.manager.findFirst({
            where: { email },
            select: {
                email: true,
                cash: true,
                account: { select: { password: true } },
            },
        });
        // 이메일
        if (!bet) {
            return res
                .status(404)
                .json({ message: '일치하는 이메일이 없습니다.' });
        }

        // 비번
        if (bet.account.password !== password) {
            return res
                .status(404)
                .json({ message: '비밀번호가 일치하지 않습니다.' });
        }

        // 캐시 보유금액
        if (!Number.isInteger(betAmount)) {
            return res
                .status(404)
                .json({ message: '캐시는 정수로 적어주세요.' });
        }
        if (bet.cash < betAmount && betAmount > 0) {
            return res.status(404).json({
                message: '0보다 크고 보유캐시보다 적은 캐시를 걸어주세요.',
            });
        }

        // 유저가 캐시를 걸면 n배로 돌려받기. 확률 설정하기
        // 0.5배: 20% |1배: 50%  |2배: 20%  |5배: 8% |10배: 1.8%  |50배: 0.2%
        const roulette = Math.random() * 100; // 0 ~ 99.9999
        let multiplyCash = 0;

        if (roulette <= 20) {
            multiplyCash = Math.floor(betAmount * 0.5);
        } else if (roulette <= 70) {
            multiplyCash = Math.floor(betAmount * 1);
        } else if (roulette <= 90) {
            multiplyCash = Math.floor(betAmount * 2);
        } else if (roulette <= 98) {
            multiplyCash = Math.floor(betAmount * 5);
        } else if (roulette <= 99.8) {
            multiplyCash = Math.floor(betAmount * 10);
        } else {
            multiplyCash = Math.floor(betAmount * 50);
        }

        await prisma.manager.update({
            data: { cash: bet.cash - betAmount + multiplyCash },
            where: { email },
        });

        return res
            .status(200)
            .json({ message: `${multiplyCash} 캐시를 획득하셨습니다.` });
    } catch (error) {
        console.error('Error fetching cash data:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// 3. 게임 승패로 캐시 증감   <- 구현방법 찾아보자

//     게임 결과로 캐시 주고 뺐기

//     게임 이기면 캐시 랜덤 쿠폰 주기

//    쿠폰 테이블 만들어야함(위에 끝나고 하기)

export default router;
