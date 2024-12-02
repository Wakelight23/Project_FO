// routes/cash.router.js

import express, { query } from 'express';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

// 선물캐시 email
router.post('/cash/gift', async (req, res, next) => {
    const { email } = req.body;
    try {
        // email이 있는지 확인
        const isEmail = await prisma.manager.findFirst({
            where: { email: email },
            select: {
                email: true,
            },
        });
        // 있으면
        if (!isEmail) {
            return res
                .status(404)
                .json({ message: '존재하지 않는 Email 입니다.' });
        }
        const giftCash = Math.floor(Math.random() * 200) + 20;
        // 원래 캐시
        const originalCache = await prisma.manager.findFirst({
            where: { email: email },
            select: {
                cash: true,
            },
        });

        await Prisma.manager.update({
            data: { cash: originalCache + giftCash },
            where: { email },
        });

        return res
            .status(200)
            .json({ message: `${giftCash}캐시를 선물받았습니다.` });
    } catch (error) {
        console.error('Error gifting cash:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// 캐시 구매 email, 캐시, pw
router.post('/cash/payment', async (req, res, next) => {
    const { email, buyCash, password } = req.body;
    if (!buyCash || buyCash <= 0) {
        return res.status(404).json({
            message: '구매하련느 캐시는 0 이상의 정수를 입력해주세요.',
        });
    }

    // email이 있는지 확인
    const isEmail = await prisma.manager.findFirst({
        where: { email: email },
        select: {
            email: true,
            password: true,
        },
    });
    // 없으면
    if (!isEmail) {
        return res.status(404).json({ message: '존재하지 않는 Email 입니다.' });
    }
    // 비번틀리면
    if (isEmail[1] != password) {
        return res.status(404).json({ message: '틀린 비밀번호 입니다.' });
    }

    const originalCache = await prisma.manager.findFirst({
        where: { email: email },
        select: {
            cash: true,
        },
    });

    await prisma.manager.update({
        data: { cash: originalCache + buyCash },
        where: { email },
    });

    return res
        .status(200)
        .json({ message: `${buyCash}캐시를 결제하셧습니다.` });
});

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