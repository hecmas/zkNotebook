// export const constants = {
//     x: 4965661367192848881n,
//     t: 147946756881789318990833708069417712967n, // 6n * x ** 2n + 1n
//     p: 21888242871839275222246405745257275088696311157297823662689037894645226208583n, // 36n * x ** 4n + 36n * x ** 3n + 24n * x ** 2n + 6n * x + 1n
//     r: 21888242871839275222246405745257275088548364400416034343698204186575808495617n, // 36n * x ** 4n + 36n * x ** 3n + 18n * x ** 2n + 6n * x + 1n
//     // assert(r === p + 1n - t);
//     ate_loop_count: [
//         0, 0, 0, 1, 0, 1, 0, -1, 0, 0, 1, -1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 0, 0,
//         1, 0, -1, 0, 0, 0, 0, 1, 1, 1, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, -1, 0,
//         0, 1, 1, 0, 0, -1, 0, 0, 0, 1, 1, 0, -1, 0, 0, 1, 0, 1, 1,
//     ], // This is 6x+2 in base {-1,0,1}
//     gamma11: [
//         8376118865763821496583973867626364092589906065868298776909617916018768340080n,
//         16469823323077808223889137241176536799009286646108169935659301613961712198316n,
//     ],
//     gamma12: [
//         21575463638280843010398324269430826099269044274347216827212613867836435027261n,
//         10307601595873709700152284273816112264069230130616436755625194854815875713954n,
//     ],
//     gamma13: [
//         2821565182194536844548159561693502659359617185244120367078079554186484126554n,
//         3505843767911556378687030309984248845540243509899259641013678093033130930403n,
//     ],
//     gamma14: [
//         2581911344467009335267311115468803099551665605076196740867805258568234346338n,
//         19937756971775647987995932169929341994314640652964949448313374472400716661030n,
//     ],
//     gamma15: [
//         685108087231508774477564247770172212460312782337200605669322048753928464687n,
//         8447204650696766136447902020341177575205426561248465145919723016860428151883n,
//     ],
//     gamma21: [
//         21888242871839275220042445260109153167277707414472061641714758635765020556617n,
//     ],
//     gamma22: [
//         21888242871839275220042445260109153167277707414472061641714758635765020556616n,
//     ],
//     gamma23: [
//         21888242871839275222246405745257275088696311157297823662689037894645226208582n,
//     ],
//     gamma24: [2203960485148121921418603742825762020974279258880205651966n],
//     gamma25: [2203960485148121921418603742825762020974279258880205651967n],
//     gamma31: [
//         11697423496358154304825782922584725312912383441159505038794027105778954184319n,
//         303847389135065887422783454877609941456349188919719272345083954437860409601n,
//     ],
//     gamma32: [
//         3772000881919853776433695186713858239009073593817195771773381919316419345261n,
//         2236595495967245188281701248203181795121068902605861227855261137820944008926n,
//     ],
//     gamma33: [
//         19066677689644738377698246183563772429336693972053703295610958340458742082029n,
//         18382399103927718843559375435273026243156067647398564021675359801612095278180n,
//     ],
//     gamma34: [
//         5324479202449903542726783395506214481928257762400643279780343368557297135718n,
//         16208900380737693084919495127334387981393726419856888799917914180988844123039n,
//     ],
//     gamma35: [
//         8941241848238582420466759817324047081148088512956452953208002715982955420483n,
//         10338197737521362862238855242243140895517409139741313354160881284257516364953n,
//     ],
// };

export const x = 4965661367192848881n;
export const t = 147946756881789318990833708069417712967n; // 6n * x ** 2n + 1n
export const p =
    21888242871839275222246405745257275088696311157297823662689037894645226208583n; // 36n * x ** 4n + 36n * x ** 3n + 24n * x ** 2n + 6n * x + 1n
export const r =
    21888242871839275222246405745257275088548364400416034343698204186575808495617n; // 36n * x ** 4n + 36n * x ** 3n + 18n * x ** 2n + 6n * x + 1n
// assert(r === p + 1n - t);
export const embedding_degree = 12n;
export const ate_loop_count = [
    0, 0, 0, 1, 0, 1, 0, -1, 0, 0, 1, -1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 0, 0, 1,
    0, -1, 0, 0, 0, 0, 1, 1, 1, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, -1, 0, 0, 1,
    1, 0, 0, -1, 0, 0, 0, 1, 1, 0, -1, 0, 0, 1, 0, 1, 1,
]; // This is 6x+2 in base {-1,0,1}

export const gamma11 = [
    8376118865763821496583973867626364092589906065868298776909617916018768340080n,
    16469823323077808223889137241176536799009286646108169935659301613961712198316n,
];

export const gamma12 = [
    21575463638280843010398324269430826099269044274347216827212613867836435027261n,
    10307601595873709700152284273816112264069230130616436755625194854815875713954n,
];

export const gamma13 = [
    2821565182194536844548159561693502659359617185244120367078079554186484126554n,
    3505843767911556378687030309984248845540243509899259641013678093033130930403n,
];

export const gamma14 = [
    2581911344467009335267311115468803099551665605076196740867805258568234346338n,
    19937756971775647987995932169929341994314640652964949448313374472400716661030n,
];

export const gamma15 = [
    685108087231508774477564247770172212460312782337200605669322048753928464687n,
    8447204650696766136447902020341177575205426561248465145919723016860428151883n,
];

export const gamma21 = [
    21888242871839275220042445260109153167277707414472061641714758635765020556617n,
];

export const gamma22 = [
    21888242871839275220042445260109153167277707414472061641714758635765020556616n,
];

export const gamma23 = [
    21888242871839275222246405745257275088696311157297823662689037894645226208582n,
];

export const gamma24 = [
    2203960485148121921418603742825762020974279258880205651966n,
];

export const gamma25 = [
    2203960485148121921418603742825762020974279258880205651967n,
];

export const gamma31 = [
    11697423496358154304825782922584725312912383441159505038794027105778954184319n,
    303847389135065887422783454877609941456349188919719272345083954437860409601n,
];

export const gamma32 = [
    3772000881919853776433695186713858239009073593817195771773381919316419345261n,
    2236595495967245188281701248203181795121068902605861227855261137820944008926n,
];

export const gamma33 = [
    19066677689644738377698246183563772429336693972053703295610958340458742082029n,
    18382399103927718843559375435273026243156067647398564021675359801612095278180n,
];

export const gamma34 = [
    5324479202449903542726783395506214481928257762400643279780343368557297135718n,
    16208900380737693084919495127334387981393726419856888799917914180988844123039n,
];

export const gamma35 = [
    8941241848238582420466759817324047081148088512956452953208002715982955420483n,
    10338197737521362862238855242243140895517409139741313354160881284257516364953n,
];

export const twist1 = [
    21575463638280843010398324269430826099269044274347216827212613867836435027261n,
    10307601595873709700152284273816112264069230130616436755625194854815875713954n,
];

export const twist2 = [
    2821565182194536844548159561693502659359617185244120367078079554186484126554n,
    3505843767911556378687030309984248845540243509899259641013678093033130930403n,
];
