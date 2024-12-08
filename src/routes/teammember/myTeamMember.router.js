import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../utils/prisma/index.js';
import { isValidInput } from './createRoster.router.js';
import authM from '../../middlewares/auth.js';

const router = express.Router();

/** 계정이 보유하고 있는 선수 목록을 조회하는 API */
/** 수백 개의 선수 카드를 보유할 수 있으므로 10명의 선수씩 조회할 수 있도록 구현했다. */
/** 예를 들어 사용자가 page의 값을 1로 입력하면 첫 페이지엔 1~10번까지의 선수가 나타나고 2를 입력하면 11~20번 선수를 확인할 수 있는 방식이다. */
router.post('/myTeamMember', authM, async (req, res, next) => {
    const { accountId } = req.account;
    const { page, orderByThis } = req.body;
    const inputs = [accountId, page].map(Number);

    console.log('accountId:', accountId); // 로그 추가
    console.log('page:', page); // 로그 추가
    console.log('orderByThis:', orderByThis); // 로그 추가

    try {
        // 유효성 검사(1 이상의 정수인가? 빈 값이 들어오진 않았는가? 데이터 형식이 다르지는 않은가?)
        const isValidInputs = inputs.every(isValidInput);
        if (!accountId) {
            return res.status(400).json({
                error: '로그인 계정을 찾을 수 없습니다.',
            });
        }
        if (!page) {
            return res.status(400).json({
                error: '조회하려는 선수 목록 페이지를 입력해주세요.',
            });
        }
        if (!isValidInputs) {
            return res.status(400).json({
                error: '잘못된 입력입니다.',
            });
        }

        // 유효한 정렬 방식이 아니면 희귀도별 정렬이 default
        const validOrderByFields = ['name', 'club', 'rarity'];
        const orderField = validOrderByFields.includes(orderByThis)
            ? orderByThis
            : 'upgrade';

        // accoutId를 통해 managerId 가져오기
        const managerId = await prisma.manager.findFirst({
            where: {
                accountId: inputs[0],
            },
            select: {
                managerId: true,
            },
        });
        // 예외처리
        // (1) 존재하지 않는 accountId인 경우
        const isExitAccountId = await prisma.account.findFirst({
            where: {
                accountId: inputs[0],
            },
        });
        if (!isExitAccountId) {
            return res.status(400).json({
                error: '존재하지 않는 accountId입니다.',
            });
        }
        // (2) 존재하지 않는 page인 경우
        // teamMember 테이블에서 조회하려는 행의 개수를 구한다.
        // 행의 개수를 10으로 나눈 숫자를 반올림하고 그 숫자보다 page가 크면 에러 반환
        const pageNumber = Math.ceil(
            (await prisma.teamMember.count({
                where: {
                    managerId: managerId.managerId,
                },
            })) / 5
        );
        if (page > pageNumber) {
            return res.status(400).json({
                error: '존재하지 않는 페이지입니다.',
            });
        }

        if (orderField === 'upgrade') {
            const membersInTeam = await prisma.teamMember.findMany({
                where: {
                    managerId: managerId.managerId,
                },
                select: {
                    teamMemberId: true,
                    upgrade: true,
                    player: {
                        select: {
                            name: true,
                            club: true,
                            speed: true,
                            goalFinishing: true,
                            shootPower: true,
                            defense: true,
                            stamina: true,
                            rarity: true,
                            playerImage: true,
                        },
                    },
                },
                orderBy: { upgrade: 'desc' },
                take: 5,
                skip: 5 * (page - 1),
            });

            return res.status(200).json(membersInTeam);
        } else if (validOrderByFields.includes(orderField)) {
            const membersInTeam = await prisma.teamMember.findMany({
                where: {
                    managerId: managerId.managerId,
                },
                select: {
                    teamMemberId: true,
                    upgrade: true,
                    player: {
                        select: {
                            name: true,
                            club: true,
                            speed: true,
                            goalFinishing: true,
                            shootPower: true,
                            defense: true,
                            stamina: true,
                            rarity: true,
                        },
                    },
                },
                orderBy: {
                    player: {
                        [orderField]: 'asc',
                    },
                },
                take: 5,
                skip: 5 * (page - 1),
            });

            return res.status(200).json(membersInTeam);
        }
    } catch (err) {
        next(err);
    }
});

export default router;
