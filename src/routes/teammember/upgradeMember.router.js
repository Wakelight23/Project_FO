import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../utils/prisma/index.js';
import { isValidInput } from './createRoster.router.js';
import authM from '../../middlewares/auth.js';

const router = express.Router();

// 같은 등급의 카드가 있으면 확률에 따라 강화가 된다.
// 강화가 실패하면 임의의 등급으로 하락한다.
// 인증 미들웨어 추가

/** 멤버 업그레이드 API */
router.patch('/upgrade', authM, async (req, res, next) => {
    const { accountId } = req.account;
    const { memberIdToUpg, memberIdToSac } = req.body;

    const memberIds = [memberIdToUpg, memberIdToSac].map(Number);

    // 유효성 검사(1 이상의 정수인가? 빈 값이 들어오진 않았는가? 데이터 형식이 다르지는 않은가?)

    const isValidMemberIds = memberIds.every(isValidInput);
    if (!accountId) {
        return res.status(400).json({
            error: '로그인 계정을 찾을 수 없습니다.',
        });
    }
    if (!memberIdToUpg || !memberIdToSac) {
        return res.status(400).json({
            error: '등급을 강화할 멤버와 강화 재료로 쓰일 멤버의 id를 모두 입력해 주세요.',
        });
    }
    if (!isValidMemberIds) {
        return res.status(400).json({
            error: '잘못된 접근입니다.',
        });
    }

    // 확률 계산. 등급이 높으면 숫자가 클 테니, 그걸 1/n+1으로 곱해서 확률을 정하면 될 것 같음.(등급이 4라면 강화 확률이 1/5 => 20%)

    try {
        // accoutId를 통해 managerId 가져오기
        const managerId = await prisma.manager.findFirst({
            where: {
                accountId: +accountId,
            },
            select: {
                managerId: true,
            },
        }).managerId;

        // 예외 처리(둘이 같은 playerId를 가지고 있는지, 등급이 같은지, 둘 다 계정의 소유가 맞는지)
        const members = await prisma.teamMember.findMany({
            where: {
                managerId,
                teamMemberId: {
                    in: memberIds,
                },
            },
            select: {
                playerId: true,
                upgrade: true,
            },
        });
        // 배열로 만든다.
        const playerIds = members.map((member) => member.playerId);
        const playerUpgrades = members.map((member) => member.upgrade);

        if (playerIds[0] !== playerIds[1]) {
            return res.status(400).json({
                error: '서로 다른 카드끼리 강화할 수 없습니다.',
            });
        }
        if (playerUpgrades[0] !== playerUpgrades[1]) {
            return res.status(400).json({
                error: '서로 다른 등급끼리 강화할 수 없습니다.',
            });
        }
        if (playerUpgrades[0] === 5) {
            return res.status(400).json({
                error: '이미 최고 등급에 도달한 카드이므로 강화할 수 없습니다.',
            });
        }

        await prisma.$transaction(
            async (tx) => {
                // 확률 구하기
                const probability = (1 / (playerUpgrades[0] + 1)) * 100;
                const randomValue = Math.floor(Math.random() * 101); // 0이상 100이하의 랜덤한 정수 뽑기

                if (randomValue > probability) {
                    // 강화 실패
                    // 등급 하락
                    const randomGrade = Math.floor(
                        Math.random() * playerUpgrades[0]
                    ); // 0 이상 기존 등급 미만의 랜덤한 등급
                    await tx.teamMember.update({
                        where: {
                            teamMemberId: memberIds[0],
                        },
                        data: {
                            upgrade: randomGrade,
                        },
                    });
                    // 재료 카드 파괴
                    await tx.teamMember.delete({
                        where: {
                            teamMemberId: memberIds[1],
                        },
                    });
                    const degradedMember = await tx.player.findFirst({
                        where: {
                            playerId: playerIds[0],
                        },
                        select: {
                            name: true,
                            club: true,
                        },
                    });
                    const degradedNumber = await tx.teamMember.findFirst({
                        where: {
                            teamMemberId: memberIds[0],
                        },
                        select: {
                            upgrade: true,
                        },
                    });

                    return res.status(200).json({
                        message:
                            '강화에 실패하였습니다. 재료 카드가 파괴되었습니다.',
                        degradedMember,
                        degradedNumber,
                    });
                }

                // 강화 성공
                // 등급 상승
                await tx.teamMember.update({
                    where: {
                        teamMemberId: memberIds[0],
                    },
                    data: {
                        upgrade: { increment: 1 },
                    },
                });
                // 재료 카드 소모
                await tx.teamMember.delete({
                    where: {
                        teamMemberId: memberIds[1],
                    },
                });
                const upgradedMember = await tx.player.findFirst({
                    where: {
                        playerId: playerIds[0],
                    },
                    select: {
                        name: true,
                        club: true,
                    },
                });
                const upgradedNumber = await tx.teamMember.findFirst({
                    where: {
                        teamMemberId: memberIds[0],
                    },
                    select: {
                        upgrade: true,
                    },
                });

                return res.status(200).json({
                    message:
                        '강화에 성공하였습니다. 재료 카드가 소모되었습니다.',
                    upgradedMember,
                    upgradedNumber,
                });
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
