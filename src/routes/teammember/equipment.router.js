import express from 'express';
import { prisma } from '../../utils/prisma/index.js';
import authM from '../../middlewares/auth.js';

const router = express.Router();

// 아이템 장착 API
router.patch('/equipment/equip', authM, async (req, res) => {
    try {
        const { accountId } = req.account;
        const { itemIds, teamMemberIds } = req.body;

        if (
            !itemIds ||
            !teamMemberIds ||
            itemIds.length !== 3 ||
            teamMemberIds.length !== 3
        ) {
            return res.status(400).json({
                error: '3명의 선수와 3개의 아이템을 순서대로 지정해야 합니다.',
            });
        }

        const manager = await prisma.manager.findUnique({
            where: { accountId: Number(accountId) },
        });

        if (!manager) {
            return res.status(404).json({
                error: '매니저 정보를 찾을 수 없습니다.',
            });
        }

        // 선택된 선수 확인
        const selectedPlayers = await prisma.teamMember.findMany({
            where: {
                managerId: manager.managerId,
                teamMemberId: { in: teamMemberIds.map(Number) },
            },
        });

        if (selectedPlayers.length !== 3) {
            return res.status(400).json({
                error: '선택한 선수를 찾을 수 없습니다.',
            });
        }

        // 트랜잭션으로 아이템 장착 처리
        await prisma.$transaction(async (tx) => {
            const usedInventoryIds = new Set();
            for (let i = 0; i < 3; i++) {
                // 기존 장착 아이템 해제
                await tx.inventory.updateMany({
                    where: {
                        managerId: manager.managerId,
                        teamMemberId: Number(teamMemberIds[i]),
                        isEquipped: true,
                    },
                    data: {
                        isEquipped: false,
                        teamMemberId: null,
                    },
                });

                // 새 아이템 찾기
                let inventoryItem = await tx.inventory.findFirst({
                    where: {
                        itemId: Number(itemIds[i]),
                        managerId: manager.managerId,
                    },
                });

                if (!inventoryItem) {
                    // 랜덤으로 3가지 아이템 선택
                    const randomItems = await tx.inventory.findMany({
                        where: {
                            managerId: manager.managerId,
                            isEquipped: false,
                        },
                        include: {
                            item: true,
                        },
                        take: 3,
                        orderBy: {
                            inventoryId: 'asc',
                        },
                    });

                    if (randomItems.length === 0) {
                        throw new Error('장착 가능한 아이템이 없습니다.');
                    }

                    unavailableItems.push({
                        itemId: itemIds[i],
                        availableItems: randomItems.map((item) => ({
                            inventoryId: item.inventoryId,
                            itemId: item.itemId,
                            name: item.item.name,
                            power: item.item.power,
                        })),
                    });
                    continue;
                } else {
                    // 중복 inventoryId 확인
                    if (usedInventoryIds.has(inventoryItem.inventoryId)) {
                        // 중복 아이템 발견 시 사용 가능한 아이템 목록 조회
                        const availableItems = await tx.inventory.findMany({
                            where: {
                                managerId: manager.managerId,
                                isEquipped: false,
                                inventoryId: {
                                    notIn: Array.from(usedInventoryIds),
                                },
                            },
                            include: {
                                item: true,
                            },
                            take: 10, // 최대 10개의 아이템만 반환
                        });

                        throw new Error(
                            JSON.stringify({
                                message: `중복된 아이템 (inventoryId: ${inventoryItem.inventoryId})이 선택되었습니다.`,
                                availableItems: availableItems.map((item) => ({
                                    inventoryId: item.inventoryId,
                                    itemId: item.itemId,
                                    name: item.item.name,
                                    power: item.item.power,
                                })),
                            })
                        );
                    }

                    // 아이템 장착
                    await tx.inventory.update({
                        where: {
                            inventoryId: inventoryItem.inventoryId,
                        },
                        data: {
                            isEquipped: true,
                            teamMemberId: Number(teamMemberIds[i]),
                        },
                    });

                    usedInventoryIds.add(inventoryItem.inventoryId);
                    equippedItems.push(inventoryItem);
                }
            }
        });

        res.status(200).json({
            message: '아이템이 성공적으로 장착되었습니다.',
        });
    } catch (error) {
        console.error('장착 에러가 발생했습니다:', error);

        // 중복 아이템 에러 처리
        if (error.message.startsWith('{')) {
            try {
                const errorData = JSON.parse(error.message);
                return res.status(400).json({
                    error: errorData.message,
                    availableItems: errorData.availableItems,
                });
            } catch (parseError) {
                // JSON 파싱 실패 시 기본 에러 메시지 반환
            }
        }
        res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    }
});

router.get('/equipment/equipped', authM, async (req, res) => {
    try {
        const { accountId } = req.account;

        const manager = await prisma.manager.findUnique({
            where: { accountId: Number(accountId) },
            include: {
                teamMembers: {
                    where: { isSelected: true },
                    include: {
                        player: true,
                        inventories: {
                            where: { isEquipped: true },
                            include: { item: true },
                        },
                    },
                },
            },
        });

        if (!manager) {
            return res
                .status(404)
                .json({ error: '매니저 정보를 찾을 수 없습니다.' });
        }

        const equippedItems = manager.teamMembers.map((member) => ({
            playerName: member.player.name,
            equippedItem: member.inventories[0]
                ? {
                      itemId: member.inventories[0].item.itemId,
                      name: member.inventories[0].item.name,
                  }
                : null,
        }));

        res.status(200).json({
            data: {
                equippedItems,
            },
        });
    } catch (error) {
        console.error('장착 아이템 조회 에러:', error);
        res.status(500).json({ error: error.message });
    }
});

// 사용자의 아이템 조회 API
router.get('/equipment/items', authM, async (req, res) => {
    try {
        const { accountId } = req.account;

        const manager = await prisma.manager.findUnique({
            where: { accountId: Number(accountId) },
        });

        if (!manager) {
            return res.status(404).json({
                error: '매니저 정보를 찾을 수 없습니다.',
            });
        }

        const inventories = await prisma.inventory.findMany({
            where: {
                managerId: manager.managerId,
            },
            include: {
                item: true,
                teamMember: {
                    include: {
                        player: true,
                    },
                },
            },
        });

        res.status(200).json({
            data: inventories.map((inv) => ({
                itemId: inv.itemId,
                name: inv.item.name,
                managerId: inv.managerId,
                stats: {
                    speed: inv.item.speed,
                    goalFinishing: inv.item.goalFinishing,
                    shootPower: inv.item.shootPower,
                    defense: inv.item.defense,
                    stamina: inv.item.stamina,
                    rarity: inv.item.rarity,
                },
                isEquipped: inv.isEquipped,
                equippedTo: inv.teamMember?.player.name || null,
                upgrade: inv.upgrade,
            })),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
