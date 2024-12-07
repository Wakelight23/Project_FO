// routes/cash.router.js
import express from 'express';
import bcrypt from 'bcrypt';

import { prisma } from '../../utils/prisma/index.js';
import authM from '../../middlewares/auth.js';

const router = express.Router();

// const bcryptPassword = await bcrypt.hash(password, 10); // 생성
// const isPasswordMatch = await bcrypt.compare(password, account.password); // 비교

/** Lucky캐시API email **/
router.get('/cash/lucky', authM, async (req, res, next) => {
    console.log('캐시 불러오기');
    const { accountId } = req.account;
    console.log(accountId);
    try {
        // email이 있는지 확인
        const account = await prisma.account.findFirst({
            where: { accountId },
            select: {
                email: true,
                manager: {
                    select: {
                        // 수정: `select`로 변경
                        cash: true,
                        managerId: true,
                    },
                },
            },
        });
        console.log(account);
        // 있으면
        if (!account) {
            return res
                .status(404)
                .json({ message: '존재하지 않는 Email 입니다.' });
        }

        const giftCash = Math.floor(Math.random() * 200) + 20;

        // originalCache는 객체 형태. originalCache -> originalCache.cash
        await prisma.manager.update({
            where: { managerId: account.manager.managerId },
            data: { cash: account.manager.cash + giftCash },
        });

        return res.status(200).json({
            message: `LUCKY!!! ${giftCash}캐시를 받았습니다.`,
            cash: giftCash,
        });
    } catch (error) {
        console.error('Error lucky cash:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

/**O 캐시 구매API email, 캐시, 비번! **/
router.post('/cash/payment', authM, async (req, res, next) => {
    const { accountId } = req.account;
    const { buyCash, password } = req.body;
    try {
        // 구매할 캐시가 유효한지 확인
        console.log(buyCash);
        if (!buyCash || buyCash <= 0) {
            return res.status(400).json({
                message: '구매하려는 캐시는 0 이상의 정수를 입력해주세요.',
            });
        }

        // 이메일과 비밀번호로 Account 조회
        const account = await prisma.account.findUnique({
            where: { accountId },
            select: {
                password: true,
                manager: {
                    select: { managerId: true, cash: true },
                },
            },
        });

        // 없으면
        if (!account) {
            return res
                .status(404)
                .json({ message: '존재하지 않는 Email 입니다.' });
        }
        // 비번확인
        const isPasswordMatch = await bcrypt.compare(
            password,
            account.password
        ); // (password, account.password);
        if (!isPasswordMatch) {
            return res
                .status(404)
                .json({ message: '비밀번호가 일치하지 않습니다.' });
        }
        // Manager 업데이트
        await prisma.manager.update({
            where: { managerId: account.manager.managerId },
            data: { cash: +(account.manager.cash + buyCash) }, // 문자로 나왔음
        });

        return res
            .status(200)
            .json({ message: `${buyCash}캐시를 결제하셧습니다.` });
    } catch (error) {
        console.error('Error fetching cash data:', error);
        return res
            .status(500)
            .json({ message: '캐시 구매 Internal server error' });
    }
});

/**O 캐시 조회API  email, 비번 추가하기 **/
router.get('/cash', authM, async (req, res, next) => {
    console.log('조회');
    const { accountId } = req.account;

    // 이메일 유효성 검사
    // if (!email || typeof email !== 'string') {
    //     return res.status(400).json({ message: 'Invalid email parameter' });
    // }
    try {
        const account = await prisma.account.findFirst({
            where: { accountId },
            select: {
                email: true,
                password: true,
                manager: {
                    select: {
                        cash: true,
                        managerId: true,
                    },
                },
            },
        });

        if (!account) {
            return res.status(404).json({ message: 'User not found' });
        }
        // 비번
        // const isPasswordMatch = await bcrypt.compare(password, account.password); // (password, account.password);
        // if (!isPasswordMatch) {
        //     return res.status(404).json({ message: '비밀번호가 일치하지 않습니다.' });
        // }

        return res.status(200).json({
            data: { email: account.email, cash: account.manager.cash },
        });
    } catch (error) {
        console.error('Error fetching cash data:', error);
        return res
            .status(500)
            .json({ message: '캐시조회 Internal server error' });
    }
});

/** 1. 다른 유저에게 캐시 선물API   비번!**/
router.post('/cash/gift', authM, async (req, res, next) => {
    try {
        const accountId = req.account.accountId;
        const { receiverEmail, amount, password } = req.body;

        // 입력정보 확인
        if (!receiverEmail || !amount || !password) {
            return res.status(400).json({
                error: '수신자 이메일, 금액, 비밀번호를 모두 입력해주세요.',
            });
        }

        // 송신자 정보 확인
        const sender = await prisma.account.findUnique({
            where: { accountId: Number(accountId) },
            include: {
                manager: true,
            },
        });

        if (!sender) {
            return res.status(404).json({
                error: '송신자 계정을 찾을 수 없습니다.',
            });
        }

        if (!sender.manager) {
            return res.status(404).json({
                error: '송신자의 매니저 정보를 찾을 수 없습니다.',
            });
        }

        // 비밀번호 확인
        const isPasswordMatch = await bcrypt.compare(password, sender.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                error: '비밀번호가 일치하지 않습니다.',
            });
        }

        // 수신자 확인
        const receiver = await prisma.account.findUnique({
            where: { email: receiverEmail },
            include: {
                manager: true,
            },
        });

        if (!receiver) {
            return res.status(404).json({
                error: '수신자 계정을 찾을 수 없습니다.',
            });
        }

        if (!receiver.manager) {
            return res.status(404).json({
                error: '수신자의 매니저 정보를 찾을 수 없습니다.',
            });
        }

        // 금액 확인
        const parsedAmount = Number(amount);
        if (!Number.isInteger(parsedAmount) || parsedAmount < 1) {
            return res.status(400).json({
                // 404 -> 400으로 변경
                error: '선물하는 금액을 1캐시 이상 입력해주세요.',
            });
        }

        // 잔액 확인
        if (sender.manager.cash < parsedAmount) {
            return res.status(400).json({
                error: '잔액이 부족합니다.',
            });
        }

        // 트랜잭션으로 캐시 이동 처리
        await prisma.$transaction([
            prisma.manager.update({
                where: { managerId: sender.manager.managerId },
                data: { cash: sender.manager.cash - parsedAmount },
            }),
            prisma.manager.update({
                where: { managerId: receiver.manager.managerId },
                data: { cash: receiver.manager.cash + parsedAmount },
            }),
        ]);

        return res.status(200).json({
            message: `${receiverEmail}님에게 ${parsedAmount}캐시를 선물했습니다.`,
        });
    } catch (error) {
        console.error('Error gifting cash:', error);
        return res
            .status(500)
            .json({ error: '캐시 선물 중 오류가 발생했습니다.' });
    }
});

/** 2. 돈 불리기 ( 행운의 룰렛)API 비번!**/
router.post('/cash/roulette', authM, async (req, res, next) => {
    console.log('여기');
    const { accountId } = req.account;
    const { betAmount, password } = req.body;
    const betingAmount = +betAmount;
    try {
        // 입력정보 유효성 확인
        const account = await prisma.account.findFirst({
            where: { accountId },
            select: {
                email: true,
                password: true,
                manager: { select: { cash: true, managerId: true } },
            },
        });
        // 이메일
        if (!account) {
            return res
                .status(404)
                .json({ message: '일치하는 이메일이 없습니다.' });
        }

        // 비번
        const isPasswordMatch = await bcrypt.compare(
            password,
            account.password
        );
        if (!isPasswordMatch) {
            return res
                .status(404)
                .json({ message: '비밀번호가 일치하지 않습니다.' });
        }

        // 캐시 보유금액
        if (!Number.isInteger(betingAmount)) {
            return res
                .status(404)
                .json({ message: '캐시는 정수로 적어주세요.' });
        }

        // 캐시 보유금액 확인
        if (!Number.isInteger(betingAmount) || betingAmount < 1) {
            return res.status(404).json({
                message: '캐시는 1 이상의 정수로 적어주세요.',
            });
        }

        if (betingAmount > account.manager.cash) {
            return res.status(404).json({
                message: '보유 캐시보다 적은 금액만 걸 수 있습니다.',
            });
        }

        // 유저가 캐시를 걸면 n배로 돌려받기. 확률 설정하기
        // 0.5배: 20% |1배: 50%  |2배: 20%  |5배: 8% |10배: 1.8%  |50배: 0.2%
        const roulette = Math.random() * 100; // 0 ~ 99.9999
        let multiplyC = 0.0;

        if (roulette <= 20) {
            multiplyC = 0.5;
        } else if (roulette <= 70) {
            multiplyC = 1;
        } else if (roulette <= 90) {
            multiplyC = 2;
        } else if (roulette <= 98) {
            multiplyC = 5;
        } else if (roulette <= 99.8) {
            multiplyC = 10;
        } else {
            multiplyC = 50;
        }

        let batR = Math.floor(betingAmount * multiplyC);

        await prisma.manager.update({
            where: { managerId: account.manager.managerId },
            data: { cash: account.manager.cash - betingAmount + batR },
        });

        return res.status(200).json({
            message: `${multiplyC}배에 당첨되셨습니다! ${batR} 캐시를 획득하셨습니다.`,
        });
    } catch (error) {
        console.error('Error fetching cash data:', error);
        return res
            .status(500)
            .json({ message: '캐시 룰렛 Internal server error' });
    }
});

/**O  3. 게임 승패로 캐시 증감API  **/
//     게임 결과로 캐시 주고 뺐기
router.post('/cash/game-result', async (req, res, next) => {
    const { winnerEmail, loserEmail, result, amount } = req.body;
    console.log('루렛들어옴');
    try {
        if (!winnerEmail || !loserEmail || !amount || amount <= 0) {
            return res.status(400).json({
                message:
                    '승자, 패자 이메일, 경기결과, 0 이상의 보상캐시을 입력해주세요.',
            });
        }

        if (!result === 0 && !result === 1) {
            return res.status(400).json({
                message:
                    '승패는 무승부면 0을, 아니면 1을 정수 형태로 넣어주세요.',
            });
        }

        // 승자 데이터 확인
        const winner = await prisma.account.findFirst({
            where: { email: winnerEmail },
            select: { manager: { select: { cash: true, managerId: true } } },
        });
        if (!winner) {
            return res
                .status(404)
                .json({ message: '승자 이메일이 존재하지 않습니다.' });
        }

        // 패자 데이터 확인
        const loser = await prisma.account.findFirst({
            where: { email: loserEmail },
            select: { manager: { select: { cash: true, managerId: true } } },
        });
        if (!loser) {
            return res
                .status(404)
                .json({ message: '패자 이메일이 존재하지 않습니다.' });
        }

        // result 승패 있으면 1, 무승부면 0 을 넣기
        let winnerReward = 0;
        let loserPenalty = 0;
        if (result) {
            winnerReward = amount;
            loserPenalty = Math.max(-loser.manager.cash, -amount); // 최대 패널티는 가진 돈까지만
        } else {
            // 무승부: 배팅 금액의 절반씩 지급
            winnerReward = Math.floor(amount / 2);
            loserPenalty = Math.floor(amount / 2);
        }

        if (isNaN(winnerReward) || isNaN(loserPenalty)) {
            throw new Error('캐시 계산1 중 오류가 발생했습니다.');
        }

        const winnerCashUpdate = winner.manager.cash + winnerReward;
        const loserCashUpdate = loser.manager.cash + loserPenalty;

        if (isNaN(winnerCashUpdate) || isNaN(loserCashUpdate)) {
            throw new Error('캐시 계산2 중 오류가 발생했습니다.');
        }

        // 데이터 업데이트
        await prisma.manager.update({
            where: { managerId: winner.manager.managerId },
            data: { cash: winnerCashUpdate },
        });
        await prisma.manager.update({
            where: { managerId: loser.manager.managerId },
            data: { cash: loserCashUpdate },
        });

        if (result) {
            return res.status(200).json({
                message: '경기보상을 받으세요!',
                gameResult: `${winnerEmail} 승리`,
                details: [
                    { email: winnerEmail, change: `+${winnerReward} 캐시` },
                    { email: loserEmail, change: `${loserPenalty} 캐시` },
                ],
            });
        } else {
            return res.status(200).json({
                message: '경기보상을 받으세요!',
                gameResult: '무승부',
                details: [
                    { email: winnerEmail, change: `+${winnerReward} 캐시` },
                    { email: loserEmail, change: `+${loserPenalty} 캐시` },
                ],
            });
        }
    } catch (error) {
        console.error('Error processing game result:', error);
        return res
            .status(500)
            .json({ message: '캐시 승패 Internal server error' });
    }
});

export default router;
