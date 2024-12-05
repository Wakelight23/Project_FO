import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../utils/prisma/index.js';
import { isValidInput } from './createRoster.router.js';
import authM from '../../middlewares/auth.js';

const router = express.Router();

/** 계정이 보유하고 있는 선수 목록을 조회하는 API */
/** 수백 개의 선수 카드를 보유할 수 있으므로 10명의 선수씩 조회할 수 있도록 구현했다. */
/** 예를 들어 사용자가 page의 값을 1로 입력하면 첫 페이지엔 1~10번까지의 선수가 나타나고 2를 입력하면 11~20번 선수를 확인할 수 있는 방식이다. */
router.get('/myTeamMember', authM, async (req, res, next) => {
    // TO-DO : 토큰 인증 미들웨어 추가
    const { accountId } = req.account; // 이 부분을 토큰으로 받을 수 있을 것 같다.
    const { page, orderByThis } = req.body;
    const inputs = [accountId, page].map(Number);

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
        if (!orderByThis) {
            return res.status(400).json({
                error: '선수 목록 정렬방식을 선택해 주세요.',
            });
        }
        if (!isValidInputs) {
            return res.status(400).json({
                error: '잘못된 입력입니다.',
            });
        }
        // const orderByOptions = {};
        if (!['name', 'club', 'rarity', 'type'].includes(orderByThis)) {
            return res.status(400).json({
                error: '해당 정렬 기능은 지원하지 않습니다. 이름별, 구단별, 희귀도별, 포지션별 정렬 기능 중에 선택해 주세요.',
            });
        }
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
            })) / 10
        );
        if (page > pageNumber) {
            return res.status(400).json({
                error: '존재하지 않는 페이지입니다.',
            });
        }

        // 선수 목록 조회
        await prisma.$transaction(
            async (tx) => {
                const membersInTeam = await tx.teamMember.findMany({
                    where: {
                        managerId: managerId.managerId,
                    },
                    select: {
                        teamMemberId: true,
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
                                type: true,
                            },
                        },
                    },
                    orderBy: {
                        player: {
                            [orderByThis]: 'desc',
                        },
                    },
                    take: 10,
                    skip: 10 * (page - 1),
                });

                return res.status(200).json(membersInTeam);
            },
            {
                isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
            }
        );
    } catch (err) {
        next(err);
    }
});

export default router;
