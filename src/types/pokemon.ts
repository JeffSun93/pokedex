export interface PokemonType {
  name: string;
  nameZh: string;
}

export interface PokemonAbility {
  name: string;
  nameZh: string;
  isHidden: boolean;
  slot: number;
}

export interface PokemonStat {
  name: string;
  nameZh: string;
  baseStat: number;
}

export interface EvolutionStep {
  id: number;
  name: string;
  nameZh: string;
  minLevel?: number;
  trigger?: string;
  item?: string;
}

export interface Pokemon {
  id: number;
  name: string;
  nameZh: string;
  height: number;
  weight: number;
  types: PokemonType[];
  abilities: PokemonAbility[];
  stats: PokemonStat[];
  sprite: string;
  artwork: string;
  generation: number;
  /** SV 标准对战分级（OU/UU/RU/NU/PU/ZU/Uber/AG/LC/NFE 及 BL 系列） */
  tier?: string;
  /** SV 分级对应 Smogon URL slug，用于构造链接 */
  tierSlug?: string;
  /** National Dex 分级（不在 SV 本传中的宝可梦） */
  natDexTier?: string;
  /** NatDex 分级对应 Smogon URL slug */
  natDexTierSlug?: string;
  /** 是否在 SV 本传中（有 SV 标准分级） */
  inSV?: boolean;
  evolutionChain: EvolutionStep[];
  flavorText?: string;
  flavorTextZh?: string;
  genus?: string;
  genusZh?: string;
}

export type FilterGeneration = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface Filters {
  search: string;
  generation: FilterGeneration;
  type: string;
  tier: string;
}

export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
};

export const TYPE_NAMES_ZH: Record<string, string> = {
  normal: '一般',
  fire: '火',
  water: '水',
  electric: '电',
  grass: '草',
  ice: '冰',
  fighting: '格斗',
  poison: '毒',
  ground: '地面',
  flying: '飞行',
  psychic: '超能力',
  bug: '虫',
  rock: '岩石',
  ghost: '幽灵',
  dragon: '龙',
  dark: '恶',
  steel: '钢',
  fairy: '妖精',
};

export const STAT_NAMES_ZH: Record<string, string> = {
  hp: 'HP',
  attack: '攻击',
  defense: '防御',
  'special-attack': '特攻',
  'special-defense': '特防',
  speed: '速度',
};

export const GENERATION_NAMES: Record<number, string> = {
  0: '全部世代',
  1: '第一世代',
  2: '第二世代',
  3: '第三世代',
  4: '第四世代',
  5: '第五世代',
  6: '第六世代',
  7: '第七世代',
  8: '第八世代',
  9: '第九世代',
};

export const SMOGON_BASE_URL = 'https://www.smogon.com/dex/sv/formats/';

/** SV 标准分级（从高到低排列） */
export const TIER_LIST = ['OU', 'UUBL', 'UU', 'RUBL', 'RU', 'NUBL', 'NU', 'PUBL', 'PU', 'ZUBL', 'ZU', 'Uber', 'AG', 'NFE', 'LC'];

/** 分级对应的颜色 */
export const TIER_COLORS: Record<string, string> = {
  AG:     '#FF6B6B',  // 深红
  Uber:   '#E74C3C',  // 红
  OU:     '#E67E22',  // 橙
  UUBL:   '#F39C12',  // 橙黄
  UU:     '#F1C40F',  // 黄
  RUBL:   '#27AE60',  // 绿
  RU:     '#2ECC71',  // 亮绿
  NUBL:   '#1ABC9C',  // 青绿
  NU:     '#16A085',  // 青
  PUBL:   '#3498DB',  // 蓝
  PU:     '#2980B9',  // 深蓝
  ZUBL:   '#8E44AD',  // 紫
  ZU:     '#9B59B6',  // 亮紫
  NFE:    '#7F8C8D',  // 灰
  LC:     '#95A5A6',  // 浅灰
};

/** 分级中文名 */
export const TIER_NAMES_ZH: Record<string, string> = {
  AG:     '无限制',
  Uber:   '超级',
  OU:     '过度使用',
  UUBL:   'UU禁用',
  UU:     '低度使用',
  RUBL:   'RU禁用',
  RU:     '极少使用',
  NUBL:   'NU禁用',
  NU:     '从未使用',
  PUBL:   'PU禁用',
  PU:     '几乎不用',
  ZUBL:   'ZU禁用',
  ZU:     '零使用',
  NFE:    '未完全进化',
  LC:     '小宝贝',
};
