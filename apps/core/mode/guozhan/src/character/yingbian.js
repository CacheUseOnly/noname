import { lib, game, ui, get, ai, _status } from "noname";
const Character = lib.element.Character;

/**
 * 文德武备开关：晋势力的部分武将有 OL（开启）和线下（关闭）两个版本。
 *
 * 这个开关是房间配置，而本文件在模块首次加载时就会执行：房主开房时房间配置还没生效，
 * 提前加载（如建房菜单里预览国战武将）也会把值固定住，所以版本必须在读取时才决定。
 */
const getJinEx = () => (_status.connectMode ? lib.configOL.jinEx : get.config("jinEx"));

const pack = {
	gz_jun_jin_simayi: new Character({
		sex: "male",
		group: "jin",
		hp: 4,
		maxHp: 4,
		skills: ["gz_jiaping", "gz_guikuang", "gz_shujuan"],
	}),
	gz_simaliang: new Character({
		sex: "male",
		group: "jin",
		hp: 4,
		maxHp: 4,
		skills: ["gz_gongzhi", "gz_sheju"],
		img: "image/character/jsrg_simaliang.jpg",
	}),
	gz_wangjun: new Character({
		sex: "male",
		group: "jin",
		hp: 4,
		maxHp: 4,
		skills: ["gz_chengliu"],
		img: "image/character/jsrg_wangjun.jpg",
	}),
	gz_malong: new Character({
		sex: "male",
		group: "jin",
		hp: 4,
		maxHp: 4,
		skills: ["gz_zhuanzhan", "gz_xunji"],
		img: "image/character/jsrg_malong.jpg",
	}),
	gz_simalun: new Character({
		sex: "male",
		group: "jin",
		hp: 4,
		maxHp: 4,
		skills: ["gz_zhulan", "gz_luanchang"],
	}),
	gz_jin_guohuai: new Character({
		sex: "female",
		group: "jin",
		hp: 3,
		maxHp: 3,
		skills: ["gz_zhefu", "gz_yidu"],
	}),
	gz_wenyang: new Character({
		sex: "male",
		group: "jin",
		hp: 5,
		maxHp: 5,
		skills: ["gz_duanqiu"],
		hasSkinInGuozhan: true,
	}),
	gz_bailingyun: new Character({
		sex: "female",
		group: "jin",
		hp: 3,
		maxHp: 3,
		skills: ["gz_xiace", "gz_limeng"],
		hasSkinInGuozhan: true,
		names: "柏|灵筠",
	}),
	gz_sunxiù: new Character({
		sex: "male",
		group: "jin",
		hp: 3,
		maxHp: 3,
		skills: ["gz_xiejian", "gz_yinsha"],
	}),
	gz_yangjun: new Character({
		sex: "male",
		group: "jin",
		hp: 4,
		maxHp: 4,
		skills: ["gz_neiji"],
	}),
	gz_wangxiang: new Character({
		sex: "male",
		group: "jin",
		hp: 3,
		maxHp: 3,
		skills: ["gz_bingxin"],
	}),
	gz_jin_zhangchunhua: new Character({
		sex: "female",
		group: "jin",
		hp: 3,
		maxHp: 3,
		skills: ["gzhuishi", "fakeqingleng"],
	}),
	gz_new_jin_zhangchunhua: new Character({
		sex: "female",
		group: "jin",
		hp: 3,
		maxHp: 3,
		skills: ["gz_ejue", "gz_shangshi"],
		img: "image/character/gz_jin_zhangchunhua.jpg",
		dieAudios: ["jin_zhangchunhua"],
	}),
	gz_jin_simayi: new Character({
		sex: "male",
		group: "jin",
		hp: 3,
		maxHp: 3,
		skills: ["fakequanbian", "smyyingshi", "fakezhouting"],
	}),
	gz_new_jin_simayi: new Character({
		sex: "male",
		group: "jin",
		hp: 4,
		maxHp: 4,
		skills: ["gz_yingshi", "gz_shunfu"],
		junName: "gz_jun_jin_simayi",
		img: "image/character/gz_jin_simayi.jpg",
		dieAudios: ["jin_simayi"],
	}),
	gz_jin_wangyuanji: new Character({
		sex: "female",
		group: "jin",
		hp: 3,
		maxHp: 3,
		skills: ["gz_yanxi", "gz_shiren"],
	}),
	gz_jin_simazhao: new Character({
		sex: "male",
		group: "jin",
		hp: 3,
		maxHp: 3,
		skills: ["gz_zhaoran", "gz_beiluan"],
	}),
	gz_jin_xiahouhui: new Character({
		sex: "female",
		group: "jin",
		hp: 3,
		maxHp: 3,
		skills: ["fakebaoqie", "jyishi", "shiduo"],
	}),
	gz_jin_simashi: new Character({
		sex: "male",
		group: "jin",
		hp: 4,
		maxHp: 4,
		skills: ["gz_yimie", "gz_ruilve"],
	}),
	gz_duyu: new Character({
		sex: "male",
		group: "jin",
		hp: 4,
		maxHp: 4,
		skills: ["gz_sanchen", "gz_pozhu"],
	}),
	gz_zhanghuyuechen: new Character({
		sex: "male",
		group: "jin",
		hp: 4,
		maxHp: 4,
		skills: ["gz_xijue", "gz_lvxian", "gz_yingwei"],
	}),
	gz_jin_yanghuiyu: new Character({
		sex: "female",
		group: "jin",
		hp: 3,
		maxHp: 3,
		skills: ["gz_ciwei", "gz_caiyuan"],
	}),
	gz_simazhou: new Character({
		sex: "male",
		group: "jin",
		hp: 4,
		maxHp: 4,
		skills: ["gz_pojing"],
	}),
	gz_shibao: new Character({
		sex: "male",
		group: "jin",
		hp: 4,
		maxHp: 4,
		skills: ["gz_zhuosheng"],
	}),
	gz_weiguan: new Character({
		sex: "male",
		group: "jin",
		hp: 3,
		maxHp: 3,
		skills: ["gz_chengxi", "gz_jiantong"],
	}),
	gz_zhongyan: new Character({
		sex: "female",
		group: "jin",
		hp: 3,
		maxHp: 3,
		skills: ["gzbolan", "yifa"],
	}),
	gz_yangyan: new Character({
		sex: "female",
		group: "jin",
		hp: 3,
		maxHp: 3,
		skills: ["gzxuanbei", "xianwan"],
	}),
	gz_zuofen: new Character({
		sex: "female",
		group: "jin",
		hp: 3,
		maxHp: 3,
		skills: ["gzzhaosong", "gzlisi"],
	}),
	gz_xuangongzhu: new Character({
		sex: "female",
		group: "jin",
		hp: 3,
		maxHp: 3,
		skills: ["fakeqimei", "ybzhuiji"],
	}),
	gz_xinchang: new Character({
		sex: "male",
		group: "jin",
		hp: 3,
		maxHp: 3,
		skills: ["fakecanmou", "congjian"],
	}),
	gz_yangzhi: new Character({
		sex: "female",
		group: "jin",
		hp: 3,
		maxHp: 3,
		skills: ["gzwanyi", "gzmaihuo"],
	}),
	gz_jin_jiachong: new Character({
		sex: "male",
		group: "jin",
		hp: 3,
		maxHp: 3,
		skills: ["gz_chujue", "gz_jianzhi"],
	}),
	gz_jin_yanghu: new Character({
		sex: "male",
		group: "jin",
		hp: 4,
		maxHp: 4,
		skills: ["gz_huaiyuan", "gz_fushou"],
	}),
	gz_sp_duyu: new Character({
		sex: "male",
		group: "qun",
		hp: 4,
		maxHp: 4,
		skills: ["gz_wuku", "gz_miewu"],
	}),
	gz_pk_sp_duyu: new Character({
		sex: "male",
		group: "qun",
		hp: 4,
		maxHp: 4,
		skills: ["fakezhufu"],
		dieAudios: ["sp_duyu"],
	}),
	gz_wangji: new Character({
		sex: "male",
		group: "wei",
		hp: 3,
		maxHp: 3,
		skills: ["fakeqizhi", "fakejinqu"],
	}),
	gz_caoying: new Character({
		sex: "female",
		group: "wei",
		hp: 4,
		tempname: ["caoying"],
		skills: ["xinfu_lingren", "xinfu_fujian"],
	}),
	gz_guansuo: new Character({
		sex: "male",
		group: "shu",
		hp: 4,
		tempname: ["guansuo"],
		skills: ["zhengnan", "xiefang"],
	}),
};

/**
 * 文德武备开启时（OL 版）覆盖的属性，上面的武将数据本身是关闭时（线下版）的
 *
 * @type {Record<string, { skills?: string[], hp?: number, maxHp?: number }>}
 */
const jinExOverrides = {
	gz_jin_wangyuanji: { skills: ["fakeyanxi", "fakeshiren"] },
	gz_jin_simazhao: { skills: ["zhaoran", "gzchoufa"] },
	gz_jin_simashi: { skills: ["gzyimie", "gztairan"], hp: 5, maxHp: 5 },
	gz_duyu: { skills: ["gzsanchen", "gzpozhu"] },
	gz_zhanghuyuechen: { skills: ["fakexijue"] },
	gz_jin_yanghuiyu: { skills: ["fakeciwei", "fakehuirong"] },
	gz_simazhou: { skills: ["caiwang", "gznaxiang"] },
	gz_shibao: { skills: ["gzzhuosheng"] },
	gz_weiguan: { skills: ["zhongyun", "shenpin"] },
	gz_jin_jiachong: { skills: ["fakexiongshu", "fakejianhui"] },
	gz_jin_yanghu: { skills: ["fakechongxin", "fakeweirong"] },
};

for (const [name, overrides] of Object.entries(jinExOverrides)) {
	const character = pack[name];
	for (const key of /** @type {const} */ (["skills", "hp", "maxHp"])) {
		if (overrides[key] === undefined) {
			continue;
		}
		const offValue = character[key];
		Object.defineProperty(character, key, {
			get: () => (getJinEx() ? overrides[key] : offValue),
			// 若有地方改写这个属性，就以改写的值为准
			set(value) {
				Object.defineProperty(character, key, { value, writable: true, enumerable: true, configurable: true });
			},
			enumerable: true,
			configurable: true,
		});
	}
}

export default pack;
