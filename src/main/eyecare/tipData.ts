/**
 * 护眼休息提示系统
 *
 * 基于权威眼科研究和指南：
 * - 美国眼科学会 (AAO) 20-20-20 法则
 * - 美国验光学会 (AOA) 数字眼疲劳指南
 * - 中国医师协会眼科分会 眼保健建议
 * - WHO 眼健康指南
 *
 * 设计原则：
 * - 短休息（5分钟）：快速可完成的放松动作
 * - 长休息（15-30分钟）：完整护眼操 + 身体活动
 * - 每条提示基于实际研究，不是随便编的
 */

export interface EyeTip {
  id: string
  title: string       // 简短标题（overlay 显示用）
  content: string     // 详细说明
  duration: string    // 建议耗时
  source: string      // 来源依据
  category: 'quick' | 'exercise' | 'lifestyle' | 'environment'
  breakType: 'short' | 'long' | 'both'  // 适用休息类型
}

// ═══════════════════════════════════════════════
//   短休息提示（5 分钟内可完成）
// ═══════════════════════════════════════════════

export const SHORT_BREAK_TIPS: EyeTip[] = [
  {
    id: 's1',
    title: '20-20-20 法则',
    content: '看向 6 米（20 英尺）以外的物体，保持 20 秒。这是缓解数字眼疲劳最有效的方法。',
    duration: '20 秒',
    source: '美国眼科学会 (AAO)',
    category: 'quick',
    breakType: 'short'
  },
  {
    id: 's2',
    title: '主动眨眼练习',
    content: '正常情况下每分钟眨眼 15-20 次，但看屏幕时会降至 5-7 次。现在有意识地快速眨眼 20 次，保持泪膜湿润。',
    duration: '30 秒',
    source: '美国验光学会 (AOA)',
    category: 'exercise',
    breakType: 'short'
  },
  {
    id: 's3',
    title: '远近交替对焦',
    content: '伸出拇指放在 15cm 处，先聚焦拇指 5 秒，再看向 6 米外的物体 5 秒。重复 10 次。锻炼睫状肌的调节能力。',
    duration: '1-2 分钟',
    source: 'AAO 眼部运动指南',
    category: 'exercise',
    breakType: 'short'
  },
  {
    id: 's4',
    title: '掌心热敷',
    content: '双手快速搓热，轻轻覆盖在闭合的双眼上（不要按压眼球）。感受温暖和黑暗，深呼吸放松。',
    duration: '30 秒',
    source: '眼科康复治疗常见方法',
    category: 'exercise',
    breakType: 'short'
  },
  {
    id: 's5',
    title: '眼球环绕运动',
    content: '闭上眼睛，缓慢转动眼球：向上→向右→向下→向左，画一个大圆。顺时针 5 圈，逆时针 5 圈。',
    duration: '1 分钟',
    source: '眼肌训练疗法',
    category: 'exercise',
    breakType: 'short'
  },
  {
    id: 's6',
    title: '看窗外远处',
    content: '将目光投向窗外最远处，寻找绿色植物或远处建筑轮廓。让眼睛自然对焦，不要刻意用力。绿色有助于放松眼部肌肉。',
    duration: '1-2 分钟',
    source: 'AAO 数字设备使用建议',
    category: 'quick',
    breakType: 'short'
  },
  {
    id: 's7',
    title: '调整屏幕亮度',
    content: '趁休息时间检查：屏幕亮度是否与环境光匹配？太亮或太暗都会加重眼疲劳。建议使用自动亮度调节。',
    duration: '10 秒',
    source: 'AOA 计算机视觉综合征指南',
    category: 'environment',
    breakType: 'short'
  },
  {
    id: 's8',
    title: '喝水 + 放松',
    content: '喝一杯水保持身体水分，同时站起来活动一下。脱水会减少泪液分泌，加重眼干症状。',
    duration: '1 分钟',
    source: 'WHO 健康指南',
    category: 'lifestyle',
    breakType: 'short'
  }
]

// ═══════════════════════════════════════════════
//   长休息提示（15-30 分钟，系统性护眼）
// ═══════════════════════════════════════════════

export const LONG_BREAK_TIPS: EyeTip[] = [
  {
    id: 'l1',
    title: '完整眼保健操',
    content: '第一节：按揉攒竹穴（眉头内侧凹陷处）\n第二节：按压睛明穴（鼻梁两侧）\n第三节：按揉四白穴（眼眶下缘中点下一寸）\n第四节：按揉太阳穴（眉梢与外眼角之间后方凹陷处）\n每个穴位按压 8×8 拍。',
    duration: '5 分钟',
    source: '中国眼保健操标准（1963年至今）',
    category: 'exercise',
    breakType: 'long'
  },
  {
    id: 'l2',
    title: '离开座位走动',
    content: '站起来走动至少 5 分钟。长时间久坐会导致全身血液循环减慢，包括眼部供血。走动时尽量看远处，让眼睛远离近距离工作。',
    duration: '5-10 分钟',
    source: 'WHO 久坐行为指南',
    category: 'lifestyle',
    breakType: 'long'
  },
  {
    id: 'l3',
    title: '肩颈放松操',
    content: '① 缓慢低头→仰头，重复 5 次\n② 左右转头，每侧保持 5 秒，重复 5 次\n③ 肩膀向前→向后画圈，各 10 次\n④ 双手交叉放在后脑勺，轻轻向后拉伸\n颈椎问题会直接影响眼部供血。',
    duration: '3-5 分钟',
    source: '颈椎与视力关联研究',
    category: 'exercise',
    breakType: 'long'
  },
  {
    id: 'l4',
    title: '自然光暴露',
    content: '如果条件允许，走到窗边或户外接受自然光照射。研究表明每天 2 小时以上的户外活动可以显著降低近视风险。即使是间接自然光也有益。',
    duration: '5-10 分钟',
    source: '《Nature》近视预防研究 (2015)',
    category: 'lifestyle',
    breakType: 'long'
  },
  {
    id: 'l5',
    title: '蒸汽眼罩 / 温热敷眼',
    content: '用温热（约 40°C）的湿毛巾敷在闭合的双眼上。温热可以促进眼周血液循环，缓解睑板腺堵塞，改善干眼症状。如果没有毛巾，搓热双掌敷眼也可以。',
    duration: '5 分钟',
    source: 'AAO 干眼症治疗指南',
    category: 'exercise',
    breakType: 'long'
  },
  {
    id: 'l6',
    title: '环境光线检查',
    content: '① 检查房间是否有屏幕反光\n② 避免背后有强光源直射屏幕\n③ 开启房间大灯，不要只开台灯\n④ 屏幕色温是否偏暖（晚间建议开护眼模式）\n环境光与屏幕亮度比建议在 1:3 以内。',
    duration: '1 分钟',
    source: 'AOA 工作站人体工学指南',
    category: 'environment',
    breakType: 'long'
  },
  {
    id: 'l7',
    title: '八方向眼球运动',
    content: '头保持不动，眼睛依次看向：上→右上→右→右下→下→左下→左→左上，每个方向保持 3 秒。重复 3 轮。充分活动六条眼外肌。',
    duration: '2 分钟',
    source: '眼肌运动康复疗法',
    category: 'exercise',
    breakType: 'long'
  },
  {
    id: 'l8',
    title: '补水 + 护眼饮食',
    content: '喝一杯水，有条件的话吃些护眼食物：\n• 蓝莓（花青素保护视网膜）\n• 胡萝卜（β-胡萝卜素）\n• 深绿色蔬菜（叶黄素、玉米黄质）\n• 坚果（维生素E）\n叶黄素是视网膜黄斑区的主要色素。',
    duration: '3 分钟',
    source: 'AREDS2 眼营养研究 (NIH)',
    category: 'lifestyle',
    breakType: 'long'
  }
]

// ═══════════════════════════════════════════════
//   工具函数
// ═══════════════════════════════════════════════

/** 根据休息类型获取提示列表 */
export function getTipsForBreakType(breakType: 'short' | 'long'): EyeTip[] {
  return breakType === 'short' ? SHORT_BREAK_TIPS : LONG_BREAK_TIPS
}

/** 获取随机提示（确保不连续重复） */
let lastTipId: string | null = null

export function getRandomTip(breakType: 'short' | 'long'): EyeTip {
  const tips = getTipsForBreakType(breakType)
  let filtered = tips.filter(t => t.id !== lastTipId)
  if (filtered.length === 0) filtered = tips // 兜底
  const tip = filtered[Math.floor(Math.random() * filtered.length)]
  lastTipId = tip.id
  return tip
}

/** 获取当前应该显示的休息类型（根据已完成番茄数） */
export function getBreakType(pomodorosCompleted: number, pomodorosBeforeLongBreak: number): 'short' | 'long' {
  if (pomodorosCompleted > 0 && pomodorosCompleted % pomodorosBeforeLongBreak === 0) {
    return 'long'
  }
  return 'short'
}

/** 格式化提示为 overlay 显示文本 */
export function formatTipForOverlay(tip: EyeTip): string {
  const sourceTag = `📎 ${tip.source}`
  return `${tip.title}\n${tip.content}\n\n⏱ ${tip.duration}  ·  ${sourceTag}`
}

/** 格式化提示为简洁标题（通知用） */
export function formatTipTitle(tip: EyeTip): string {
  return tip.title
}

/** 格式化提示为通知正文 */
export function formatTipBody(tip: EyeTip): string {
  // 截取前50个字符作为摘要
  const summary = tip.content.length > 60 ? tip.content.slice(0, 60) + '...' : tip.content
  return `${summary}\n⏱ ${tip.duration}`
}
