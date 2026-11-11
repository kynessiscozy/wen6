/* 引路人只决定阅读线索与反思问题，不参与排盘、评分或输入数据。
   此模块只读已计算结果；数据缺失时不编造依据。
   V6.1（2026-11-11 定版）：六位引路人各有专长方向——
   月白全能、玉宸事业、夕瑶姻缘、焱绒财富、絮羽塔罗、星罗占星。 */
const GUIDES = Object.freeze({
  moonfox: Object.freeze({ name: '月白', title: '神秘人', focus: '全能推演',
    prompt: '不预设方向，先把整张盘看全：哪些线索彼此印证，哪些还互相矛盾？' }),
  yuchen: Object.freeze({ name: '玉宸', title: '事业', focus: '事业推演',
    prompt: '专看事业这一条线：眼下这步大运里，哪一件事最值得先押注？' }),
  xingling: Object.freeze({ name: '夕瑶', title: '姻缘', focus: '姻缘推演',
    prompt: '专看姻缘这一条线：你心里那个人，和盘里写的缘分对得上吗？' }),
  diyan: Object.freeze({ name: '焱绒', title: '财富', focus: '财富推演',
    prompt: '专看财富这一条线：你的财从哪里来，又最容易从哪里漏掉？' }),
  muse: Object.freeze({ name: '絮羽', title: '卡罗大师', focus: '塔罗推演',
    prompt: '先把问题在心里问清楚，再去翻牌：牌面说的，和你盘里写的，是不是同一件事？' }),
  xingluo: Object.freeze({ name: '星罗', title: '占星术', focus: '占星推演',
    prompt: '先看星盘的骨架——太阳、月亮、上升落在哪里，你的底色就定在哪里。' }),
});

const text = value => typeof value === 'string' ? value.trim() : '';
const pillar = value => [text(value?.g), text(value?.z)].join('');
const fact = (label, value) => value ? `${label} ${value}` : '';

/** Generate presentation-only prompts; never modify ctx or western. */
export function buildGuidePerspective(themeId, ctx = {}, western = {}) {
  const guide = GUIDES[themeId];
  if (!guide) return null; // Older traits continue to use their existing presentation.
  const day = [text(ctx?.dg), text(ctx?.dw)].join('');
  const chart = western?.astro || {};
  const sun = text(chart.sun?.name), moon = text(chart.moon?.name), asc = text(chart.asc?.name);
  const planetSign = key => text((chart.planets || []).find(p => p?.key === key)?.sign?.name);
  const mercury = planetSign('Mercury'), venus = planetSign('Venus'),
    mars = planetSign('Mars'), jupiter = planetSign('Jupiter');
  let eastern, westernFacts;
  switch (themeId) {
    case 'moonfox': // 全能：东西方全景并陈
      eastern = [fact('日主', day), fact('用神', text(ctx?.wx?.ys)),
        fact('月柱', pillar(ctx?.b?.M)), fact('日柱', pillar(ctx?.b?.D))];
      westernFacts = [fact('太阳', sun), fact('月亮', moon), fact('上升', asc)];
      break;
    case 'yuchen': // 事业：大运流年定窗口，太阳·火星看驱动
      eastern = [fact('当前大运', pillar(ctx?.cDy)), fact('流年', pillar(ctx?.cLn))];
      westernFacts = [fact('太阳', sun), fact('火星', mars)];
      break;
    case 'xingling': // 姻缘：日支配偶宫为锚，金星·月亮看情感
      eastern = [fact('日支', text(ctx?.b?.D?.z)), fact('日主', day)];
      westernFacts = [fact('金星', venus), fact('月亮', moon)];
      break;
    case 'diyan': // 财富：日主·用神看财源根基，木星看扩张机遇
      eastern = [fact('日主', day), fact('用神', text(ctx?.wx?.ys))];
      westernFacts = [fact('木星', jupiter), fact('太阳', sun)];
      break;
    case 'muse': // 塔罗：月亮·水星主直觉与讯息，东方退为背景节律
      eastern = [fact('月柱', pillar(ctx?.b?.M)), fact('当前流年', pillar(ctx?.cLn))];
      westernFacts = [fact('月亮', moon), fact('水星', mercury)];
      break;
    case 'xingluo': // 占星：星盘三要素在先，年柱·大运为辅
      eastern = [fact('年柱', pillar(ctx?.b?.Y)), fact('当前大运', pillar(ctx?.cDy))];
      westernFacts = [fact('太阳', sun), fact('上升', asc), fact('月亮', moon)];
      break;
  }
  return {
    ...guide,
    eastern: eastern.filter(Boolean).join(' · '),
    western: westernFacts.filter(Boolean).join(' · '),
  };
}
