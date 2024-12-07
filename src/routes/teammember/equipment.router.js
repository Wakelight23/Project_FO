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
            // 새로운 아이템 장착
            for (let i = 0; i < 3; i++) {
                await tx.inventory.update({
                    where: {
                        inventoryId: Number(itemIds[i]),
                    },
                    data: {
                        isEquipped: true,
                        teamMemberId: Number(teamMemberIds[i]),
                    },
                });
            }
        });

        res.status(200).json({
            message: '아이템이 성공적으로 장착되었습니다.',
        });
    } catch (error) {
        console.error('Equipment error:', error);
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
                teamMemberId: inv.teamMember?.teamMemberId || null, // 팀 멤버 ID 추가
                upgrade: inv.upgrade,
            })),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
