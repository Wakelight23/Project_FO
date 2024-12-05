import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../utils/prisma/index.js';
import authM from '../../middlewares/auth.js';
import { calculateTeamPower } from '../../logic/gameplay.js';

const router = express.Router();

/** Number 형식 유효성 검사 함수(1이상의 정수를 받아야 할 때 사용) */
export const isValidInput = (input) =>
    /^[0-9]+$/.test(+input) && Number(+input) >= 1;

/** 출전 선수를 선발하는 API */
router.patch('/rosterIn', authM, async (req, res, next) => {
    const { teamMemberId1, teamMemberId2, teamMemberId3 } = req.body;
    const { accountId } = req.account;
    // TO-DO : 토큰 인증 미들웨어 추가

    // 트랜젝션 내부에선 형변환이 제대로 되지 않는 경우가 있어서 미리 해준다.
    const teamMemberIds = [teamMemberId1, teamMemberId2, teamMemberId3].map(
        Number
    );

    // (1) 유효성 검사(1 이상의 정수인가?)
    const isValidAccountId = isValidInput(accountId);
    const isValidteamMemberId = teamMemberIds.every(isValidInput);

    // (2) 예외 처리
    if (!accountId) {
        return res.status(400).json({
            error: '로그인 계정을 찾을 수 없습니다.',
        });
    }
    if (!isValidAccountId) {
        return res.status(400).json({
            error: '잘못된 계정을 통한 접근입니다.',
        });
    }
    if (!teamMemberId1 || !teamMemberId2 || !teamMemberId3) {
        return res.status(400).json({
            error: '세 개의 teamMemberId를 모두 입력해주세요.',
        });
    }
    if (!isValidteamMemberId) {
        return res.status(400).json({
            error: 'teamMemberId는 1이상의 정수여야 합니다.',
        });
    }

    try {
        // id가 없는 선수를 선발했을 때(id에 1억을 입력한다거나...) 예외 처리
        const isValidPlayer = await prisma.teamMember.findMany({
            where: {
                teamMemberId: {
                    in: teamMemberIds,
                },
            },
        });
        if (isValidPlayer.length !== 3) {
            return res.status(401).json({ error: '잘못된 요청입니다.' });
        }
        // accoutId를 통해 managerId 가져오기
        const managerId = await prisma.manager.findFirst({
            where: {
                accountId: +accountId,
            },
            select: {
                managerId: true,
            },
        });

        // 선수들의 데이터를 배열로 가져오기
        const result = await prisma.$transaction(
            async (tx) => {
                // 혹시! isSelected가 true인 선수가 이미 있다면 모두 false로 바꿔주기
                await tx.teamMember.updateMany({
                    where: {
                        managerId: managerId.managerId,
                        isSelected: true,
                    },
                    data: {
                        isSelected: false,
                    },
                });
                // 선택한 선수의 isSelected 밸류를 true로 변경(게임이 끝나면 false로 바꿔주기)
                await tx.teamMember.updateMany({
                    where: {
                        managerId: managerId.managerId,
                        teamMemberId: {
                            in: teamMemberIds,
                        },
                    },
                    data: {
                        isSelected: true,
                    },
                });

                // 선발된 선수의 playerId 조회하기
                const membersInRoster = await tx.teamMember.findMany({
                    where: {
                        teamMemberId: {
                            in: teamMemberIds,
                        },
                    },
                    select: {
                        teamMemberId: true,
                        playerId: true,
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
                                type: true,
                            },
                        },
                    },
                });

                return membersInRoster;
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
        );

        // 예상 점수
        const teamPower = calculateTeamPower(result);

        return res.status(201).json({ players: result, teamPower });
    } catch (err) {
        next(err); // 에러를 다음 미들웨어로 전달
    }
});

/** 선발 선수를 다른 선수로 변경하는 API */
router.patch('/rosterOut', authM, async (req, res, next) => {
    // TO-DO: 토큰 인증

    try {
        const { accountId } = req.account;

        // accoutId를 통해 managerId 가져오기
        const managerId = await prisma.manager.findFirst({
            where: {
                accountId: +accountId,
            },
            select: {
                managerId: true,
            },
        }).managerId;

        // 교체할 선수 둘을 request body를 통해 요청받는다.
        const { outMemberId, inMemberId } = req.body;
        const memberIds = [outMemberId, inMemberId].map(Number);

        // (1) 유효성 검사(1 이상의 정수인가?)
        const isValidAccountId = isValidInput(accountId);
        const isValidMemberId = memberIds.every(isValidInput);

        // (2) 예외 처리
        if (!accountId) {
            return res.status(400).json({
                error: '로그인 계정을 찾을 수 없습니다.',
            });
        }
        if (!isValidAccountId) {
            return res.status(400).json({
                error: '잘못된 계정을 통한 접근입니다.',
            });
        }
        if (!outMemberId || !inMemberId) {
            return res.status(400).json({
                error: '서로 교체할 teamMemberId를 모두 입력해주세요.',
            });
        }
        if (!isValidMemberId) {
            return res.status(400).json({
                error: 'teamMemberId는 1이상의 정수여야 합니다.',
            });
        }

        // 예외처리 (teamtest 테이블에서 조회했을 때 outMemberId를 조회했을 때 isSelected가 true인가?)
        const isValidOutMember = await prisma.teamMember.findUnique({
            where: {
                teamMemberId: memberIds[0],
            },
            select: {
                isSelected: true,
            },
        });
        if (!isValidOutMember.isSelected) {
            return res.status(400).json({
                error: '잘못된 요청입니다. outMemberId에는 현재 선발 중인 선수의 id를 입력해주세요.',
            });
        }

        // 예외처리 (teamtest 테이블에서 조회했을 때 inMemberId를 조회했을 때 isSelected가 false인가?)
        const isValidInMember = await prisma.teamMember.findUnique({
            where: {
                // managerId: +managerId,
                teamMemberId: memberIds[1],
            },
            select: {
                isSelected: true,
            },
        });

        if (isValidInMember.isSelected) {
            return res.status(400).json({
                error: '잘못된 요청입니다. inMemberId에는 현재 선발 중인 선수의 id를 입력할 수 없습니다.',
            });
        }

        await prisma.$transaction(
            async (tx) => {
                // accoutId를 통해 managerId 가져오기
                const managerId = await prisma.manager.findFirst({
                    where: {
                        accountId: +accountId,
                    },
                    select: {
                        managerId: true,
                    },
                }).managerId;

                await tx.teamMember.updateMany({
                    where: {
                        managerId,
                        teamMemberId: memberIds[0],
                    },
                    data: {
                        isSelected: false,
                    },
                });
                await tx.teamMember.updateMany({
                    where: {
                        managerId,
                        teamMemberId: memberIds[1],
                    },
                    data: {
                        isSelected: true,
                    },
                });
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
        );

        // 바뀐 선발 선수 명단을 반환
        const membersInRoster = await prisma.teamMember.findMany({
            where: {
                managerId,
                isSelected: true,
            },
            select: {
                teamMemberId: true,
                playerId: true,
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
                        type: true,
                    },
                },
            },
        });
        // 예상 점수
        const teamPower = calculateTeamPower(membersInRoster);

        return res.status(200).json({ membersInRoster, teamPower });
    } catch (err) {
        next(err);
    }
});

export default router;
