import { menuContainer, popupContainer, updateActive, setUpdateActive, updateActiveCard, setUpdateActiveCard, menux, menuxpages, menuUpdates, openMenu, clickToggle, clickSwitcher, clickContainer, clickMenuItem, createMenu, createConfig } from "../index.js";
import { ui, game, get, ai, lib, _status } from "noname";

export const characterPackMenu = function (connectMenu) {
	/**
	 * 由于联机模式会创建第二个菜单，所以需要缓存一下可变的变量
	 */
	// const cacheMenuContainer = menuContainer;
	// const cachePopupContainer = popupContainer;
	const cacheMenux = menux;
	const cacheMenuxpages = menuxpages;
	/** @type { HTMLDivElement } */
	// @ts-expect-error ignore
	var start = cacheMenuxpages.shift();
	// 用于切换显示对应武将包所有武将的界面
	var rightPane = start.lastChild;

	var clickMode = function () {
		var active = this.parentNode.querySelector(".active");
		if (active) {
			if (active === this) {
				return;
			}
			active.classList.remove("active");
			active.link.remove();
		}
		this.classList.add("active");
		updateActive(this);
		if (this.link) {
			rightPane.appendChild(this.link);
		} else {
			this._initLink();
			rightPane.appendChild(this.link);
		}
	};
	/** 联机建房时，随所选模式显示/隐藏“国战武将”页（见文件末尾），非联机菜单下不会被赋值 */
	let syncGuozhanPage;
	/** 联机建房时，单独开启/关闭一个国战武将（见文件末尾） */
	let toggleGuozhanCharacter;
	setUpdateActive(function (node) {
		if (syncGuozhanPage) {
			syncGuozhanPage();
		}
		if (!node) {
			node = start.firstChild.querySelector(".active");
			if (!node) {
				return;
			}
		}
		if (!node.link) {
			node._initLink();
		}
		for (var i = 0; i < node.link.childElementCount; i++) {
			if (node.link.childNodes[i].updateBanned) {
				node.link.childNodes[i].updateBanned();
			}
		}
	});
	var updateNodes = function () {
		for (var i = 0; i < start.firstChild.childNodes.length; i++) {
			var node = start.firstChild.childNodes[i];
			if (node.mode) {
				if (node.mode.startsWith("mode_")) {
					// 扩展武将包开启逻辑
					if (node.mode.startsWith("mode_extension")) {
						const extName = node.mode.slice(15);
						if (!game.hasExtension(extName) || !game.hasExtensionLoaded(extName)) {
							continue;
						}
						if (lib.config[`extension_${extName}_characters_enable`] == true) {
							node.classList.remove("off");
							if (node.link) {
								node.link.firstChild.classList.add("on");
							}
						} else {
							node.classList.add("off");
							if (node.link) {
								node.link.firstChild.classList.remove("on");
							}
						}
					}
					continue;
				}
				if (node.mode == "custom") {
					continue;
				}
				if (connectMenu) {
					if (!lib.config.connect_characters.includes(node.mode)) {
						node.classList.remove("off");
						if (node.link) {
							node.link.firstChild.classList.add("on");
						}
					} else {
						node.classList.add("off");
						if (node.link) {
							node.link.firstChild.classList.remove("on");
						}
					}
				} else {
					if (lib.config.characters.includes(node.mode)) {
						node.classList.remove("off");
						if (node.link) {
							node.link.firstChild.classList.add("on");
						}
					} else {
						node.classList.add("off");
						if (node.link) {
							node.link.firstChild.classList.remove("on");
						}
					}
				}
			}
		}
	};
	var togglePack = function (bool) {
		var name = this._link.config._name;
		// 扩展武将包开启逻辑
		if (name.startsWith("mode_extension")) {
			const extName = name.slice(15);
			if (!game.hasExtension(extName) || !game.hasExtensionLoaded(extName)) {
				return false;
			}
			game.saveExtensionConfig(extName, "characters_enable", bool);
		}
		// 原逻辑
		else {
			if (connectMenu) {
				if (!bool) {
					lib.config.connect_characters.add(name);
				} else {
					lib.config.connect_characters.remove(name);
				}
				game.saveConfig("connect_characters", lib.config.connect_characters);
			} else {
				if (bool) {
					lib.config.characters.add(name);
				} else {
					lib.config.characters.remove(name);
				}
				game.saveConfig("characters", lib.config.characters);
			}
		}
		updateNodes();
	};

	var createModeConfig = function (mode, position, position2) {
		var _info = lib.characterPack[mode];
		var page = ui.create.div("");
		var node = ui.create.div(".menubutton.large", lib.translate[mode + "_character_config"], position, clickMode);
		if (node.innerHTML.length >= 5) {
			node.classList.add("smallfont");
		}
		if (position2) {
			position.insertBefore(node, position2);
		}
		node.mode = mode;
		node._initLink = function () {
			node.link = page;
			page.node = node;
			var list = [];
			var boolAI = lib.config[`forbidai_user_${mode}`];
			for (var i in _info) {
				const characterInfo = _info[i];
				if (characterInfo.isUnseen) {
					continue;
				}
				if (connectMenu && lib.connectBanned.includes(i)) {
					continue;
				}
				list.push(i);
				// if (Boolean(boolAI) !== lib.config.forbidai_user.includes(i)) {
				//	lib.config.forbidai_user[boolAI ? "add" : "remove"](i);
				//	game.saveConfig("forbidai_user", lib.config.forbidai_user);
				// }
				for (var j = 0; j < characterInfo.skills.length; j++) {
					if (!lib.skill[characterInfo.skills[j]]) {
						continue;
					}
				}
			}
			list.sort(lib.sort.character);
			var list2 = list.slice(0);
			var cfgnode = createConfig({
				name: "开启",
				_name: mode,
				init: (() => {
					// 扩展武将包开启逻辑
					if (mode.startsWith("mode_extension")) {
						const extName = mode.slice(15);
						if (!game.hasExtension(extName) || !game.hasExtensionLoaded(extName)) {
							return false;
						}
						// 这块或许应该在加载扩展时候写
						if (lib.config[`extension_${extName}_characters_enable`] === undefined) {
							game.saveExtensionConfig(extName, "characters_enable", true);
						}
						return lib.config[`extension_${extName}_characters_enable`] === true;
					}
					// 原逻辑
					else {
						return connectMenu ? !lib.config.connect_characters.includes(mode) : lib.config.characters.includes(mode);
					}
				})(),
				onclick: togglePack,
			});
			var cfgnodeAI = createConfig({
				name: "仅点将可用",
				_name: mode,
				init: boolAI,
				intro: "将该武将包内的武将全部设置为仅点将可用",
				onclick(bool) {
					game.saveConfig(`forbidai_user_${mode}`, bool);
					// lib.config.forbidai_user[bool ? "addArray" : "removeArray"](list);
					// game.saveConfig("forbidai_user", lib.config.forbidai_user);
				},
			});
			if (!mode.startsWith("mode_")) {
				cfgnodeAI.style.marginTop = "0px";
				page.appendChild(cfgnode);
				page.appendChild(cfgnodeAI);
			} else if (mode.startsWith("mode_extension")) {
				// 排除4个基本扩展
				// 给扩展的武将包加一个开启关闭的功能
				if (!lib.config.all.stockextension.includes(mode.slice(15))) {
					page.appendChild(cfgnode);
					cfgnodeAI.style.marginTop = "0px";
				}
				page.appendChild(cfgnodeAI);
			} else {
				page.style.paddingTop = "8px";
			}
			if (lib.translate[mode + "_charactersInfo"]) {
				var modeTranslation = '<p style="padding-left: 2em; margin-block: unset;">' + lib.translate[mode + "_charactersInfo"] + "</p>";
				page.insertAdjacentHTML("beforeend", modeTranslation);
			}
			var banCharacter = function (e) {
				if (_status.clicked) {
					_status.clicked = false;
					return;
				}
				// 联机建房时，点击“国战武将”页里的武将，单独开启/关闭该武将
				if (connectMenu && mode == "mode_guozhan") {
					toggleGuozhanCharacter?.(this);
					return;
				}
				if (mode.startsWith("mode_") && !mode.startsWith("mode_extension_") && mode != "mode_favourite" && mode != "mode_banned") {
					if (!connectMenu && lib.config.show_charactercard) {
						ui.click.charactercard(this.link, this, mode == "mode_guozhan" ? "guozhan" : true);
					}
					return;
				}
				ui.click.touchpop();
				this._banning = connectMenu ? "online" : "offline";
				if (!connectMenu && lib.config.show_charactercard) {
					ui.click.charactercard(this.link, this);
				} else {
					ui.click.intro.call(this, e);
				}
				_status.clicked = false;
				delete this._banning;
			};
			var updateBanned = function () {
				var _list;
				if (connectMenu) {
					var mode = cacheMenux.pages[0].firstChild.querySelector(".active");
					if (mode && mode.mode) {
						_list = lib.config["connect_" + mode.mode + "_banned"];
					}
				} else {
					_list = lib.config[get.mode() + "_banned"];
				}
				if (_list && _list.includes(this.link)) {
					this.classList.add("banned");
				} else {
					this.classList.remove("banned");
				}
			};
			if (lib.characterSort[mode]) {
				var listb = [];
				if (!connectMenu) {
					listb = lib.config[get.mode() + "_banned"] || [];
				} else {
					var modex = cacheMenux.pages[0].firstChild.querySelector(".active");
					if (modex && modex.mode) {
						listb = lib.config["connect_" + modex.mode + "_banned"];
					}
				}
				for (var pak in lib.characterSort[mode]) {
					var info = lib.characterSort[mode][pak];
					var listx = [];
					var boolx = false;
					for (var ii = 0; ii < list2.length; ii++) {
						if (info.includes(list2[ii])) {
							listx.add(list2[ii]);
							if (!listb.includes(list2[ii])) {
								boolx = true;
							}
							list2.splice(ii--, 1);
						}
					}
					if (listx.length) {
						var cfgnodeY = {
							name: lib.translate[pak],
							intro: lib.translate[pak + "_info"] || false,
							_name: pak,
							init: boolx,
							onclick(bool) {
								var banned = [];
								if (connectMenu) {
									var modex = cacheMenux.pages[0].firstChild.querySelector(".active");
									if (modex && modex.mode) {
										banned = lib.config["connect_" + modex.mode + "_banned"];
									}
								} else if (_status.connectMode) {
									return;
								} else {
									banned = lib.config[get.mode() + "_banned"] || [];
								}
								var listx = lib.characterSort[mode][this._link.config._name];
								if (bool) {
									for (var i = 0; i < listx.length; i++) {
										banned.remove(listx[i]);
									}
								} else {
									for (var i = 0; i < listx.length; i++) {
										banned.add(listx[i]);
									}
								}
								game.saveConfig(connectMenu ? "connect_" + modex.mode + "_banned" : get.mode() + "_banned", banned);
								updateActive();
							},
						};
						if (mode.startsWith("mode_") && !mode.startsWith("mode_extension_") && !mode.startsWith("mode_guozhan")) {
							cfgnodeY.clear = true;
							delete cfgnodeY.onclick;
						}
						var cfgnodeX = createConfig(cfgnodeY);
						page.appendChild(cfgnodeX);
						var buttons = ui.create.buttons(listx, "character", page);
						for (var i = 0; i < buttons.length; i++) {
							buttons[i].classList.add("noclick");
							buttons[i].listen(banCharacter);
							ui.create.rarity(buttons[i]);
							buttons[i].node.hp.style.transition = "all 0s";
							buttons[i].node.hp._innerHTML = buttons[i].node.hp.innerHTML;
							if (mode != "mode_banned") {
								buttons[i].updateBanned = updateBanned;
							}
						}
					}
				}
				if (list2.length) {
					var cfgnodeX = createConfig({
						name: "其他",
						_name: "others",
						clear: true,
					});
					page.appendChild(cfgnodeX);
					var buttons = ui.create.buttons(list2, "character", page);
					for (var i = 0; i < buttons.length; i++) {
						buttons[i].classList.add("noclick");
						buttons[i].listen(banCharacter);
						ui.create.rarity(buttons[i]);
						buttons[i].node.hp.style.transition = "all 0s";
						buttons[i].node.hp._innerHTML = buttons[i].node.hp.innerHTML;
						if (mode != "mode_banned") {
							buttons[i].updateBanned = updateBanned;
						}
					}
				}
			} else {
				var buttons = ui.create.buttons(list, "character", page);
				for (var i = 0; i < buttons.length; i++) {
					buttons[i].classList.add("noclick");
					ui.create.rarity(buttons[i]);
					buttons[i].listen(banCharacter);
					buttons[i].node.hp.style.transition = "all 0s";
					buttons[i].node.hp._innerHTML = buttons[i].node.hp.innerHTML;
					if (mode != "mode_banned") {
						buttons[i].updateBanned = updateBanned;
					}
				}
			}
			page.classList.add("menu-buttons");
			page.classList.add("leftbutton");
			if (!connectMenu) {
				if (lib.config.all.sgscharacters.includes(mode)) {
					ui.create.div(".config.pointerspan", '<span style="opacity:0.5">该武将包不可被隐藏</span>', page);
				} else if (!mode.startsWith("mode_")) {
					ui.create.div(".config.pointerspan", "<span>隐藏武将包</span>", page, function () {
						if (this.firstChild.innerHTML == "隐藏武将包") {
							if (confirm("真的要隐藏“" + get.translation(mode + "_character_config") + "”武将包吗？\n建议使用“关闭”而不是“隐藏”功能，否则将会影响其他相关武将包的正常运行！")) {
								this.firstChild.innerHTML = "武将包将在重启后隐藏";
								lib.config.hiddenCharacterPack.add(mode);
								if (!lib.config.prompt_hidepack) {
									alert("隐藏的扩展包可通过选项-其它-重置隐藏内容恢复");
									game.saveConfig("prompt_hidepack", true);
								}
							}
						} else {
							this.firstChild.innerHTML = "隐藏武将包";
							lib.config.hiddenCharacterPack.remove(mode);
						}
						game.saveConfig("hiddenCharacterPack", lib.config.hiddenCharacterPack);
					});
				}
			}
		};
		if (!get.config("menu_loadondemand")) {
			node._initLink();
		}
		return node;
	};
	if (lib.config.show_favourite_menu && !connectMenu && Array.isArray(lib.config.favouriteCharacter)) {
		lib.characterPack.mode_favourite = {};
		for (var i = 0; i < lib.config.favouriteCharacter.length; i++) {
			var favname = lib.config.favouriteCharacter[i];
			if (lib.character[favname]) {
				lib.characterPack.mode_favourite[favname] = lib.character[favname];
			}
		}
		var favouriteCharacterNode = createModeConfig("mode_favourite", start.firstChild);
		if (!favouriteCharacterNode.link) {
			favouriteCharacterNode._initLink();
		}
		ui.favouriteCharacter = favouriteCharacterNode.link;
		if (get.is.empty(lib.characterPack.mode_favourite)) {
			ui.favouriteCharacter.node.style.display = "none";
		}
		delete lib.characterPack.mode_favourite;
	}
	if (!connectMenu && lib.config.show_ban_menu) {
		lib.characterPack.mode_banned = {};
		for (var i = 0; i < lib.config.all.mode.length; i++) {
			var banned = lib.config[lib.config.all.mode[i] + "_banned"];
			if (banned) {
				for (var j = 0; j < banned.length; j++) {
					if (lib.character[banned[j]]) {
						lib.characterPack.mode_banned[banned[j]] = lib.character[banned[j]];
					}
				}
			}
		}
		var bannednode = createModeConfig("mode_banned", start.firstChild);
		if (get.is.empty(lib.characterPack.mode_banned)) {
			bannednode.style.display = "none";
		}
		delete lib.characterPack.mode_banned;
	}
	var characterlist = connectMenu ? lib.connectCharacterPack : lib.config.all.characters;
	for (var i = 0; i < characterlist.length; i++) {
		createModeConfig(characterlist[i], start.firstChild);
	}
	if (!connectMenu) {
		Object.keys(lib.characterPack).forEach(key => {
			// 单机模式下显示不在lib.config.all.characters里的武将包
			if (!characterlist.includes(key)) {
				createModeConfig(key, start.firstChild);
			}
			if (connectMenu) {
				lib.connectCharacterPack.add(key);
			}
		});
	}
	var active = start.firstChild.querySelector(".active");
	if (!active) {
		active = start.firstChild.firstChild;
		if (active.style.display == "none") {
			active = active.nextSibling;
			if (active.style.display == "none") {
				active = active.nextSibling;
			}
		}
		active.classList.add("active");
		updateActive(active);
	}
	if (!active.link) {
		active._initLink();
	}
	rightPane.appendChild(active.link);

	if (!connectMenu) {
		// 下面使用了var的特性，请不要在这里直接改为let
		var node1 = ui.create.div(".lefttext", "全部开启", start.firstChild, function () {
			game.saveConfig(
				"characters",
				Object.keys(lib.characterPack).filter(mode => {
					return !mode.startsWith("mode_") || (mode.startsWith("mode_extension_") && lib.config.all.stockextension.includes(mode.slice(15)));
				})
			);
			updateNodes();
		});
		var node3 = ui.create.div(".lefttext", "全部关闭", start.firstChild, function () {
			game.saveConfig("characters", []);
			updateNodes();
		});
		var node2 = ui.create.div(".lefttext", "恢复默认", start.firstChild, function () {
			game.saveConfig("characters", lib.config.defaultcharacters);
			updateNodes();
		});
		node1.style.marginTop = "12px";
		node3.style.marginTop = "7px";
		node2.style.marginTop = "2px";
	}

	updateNodes();

	if (connectMenu && lib.mode.guozhan) {
		/**
		 * 联机建房菜单的“武将”页只列出联机武将包，列不出国战专属的 mode_guozhan 武将池。
		 * 所以选中国战模式时，按需引入国战数据，补上与单机一致的“国战武将”页，
		 * 分类开关保存在 connect_guozhan_banned，开房后由国战选将读取。
		 */
		let guozhanNode = null;
		let guozhanLoading = false;

		const getSelectedMode = () => cacheMenux.pages[0]?.firstChild?.querySelector(".active")?.mode;

		const loadGuozhanPack = async () => {
			const mode = await game.loadModeAsync("guozhan");
			const pack = mode.characterPack.mode_guozhan;
			lib.characterPack.mode_guozhan = pack;
			lib.characterSort.mode_guozhan = mode.characterSort.mode_guozhan;
			lib.translate.mode_guozhan_character_config = mode.translate.mode_guozhan_character_config;
			for (const sort in mode.characterSort.mode_guozhan) {
				lib.translate[sort] = mode.translate[sort];
			}
			// 页面按钮需要 lib.character 里有对应武将；译名与国战开局时一致，缺失时沿用标准武将的
			for (const name in pack) {
				lib.character[name] ??= pack[name];
				lib.translate[name] ??= mode.translate[name] ?? lib.translate[name.slice(3)];
			}
		};

		/**
		 * 头像路径的解析依赖 get.mode() 为国战（会把 gz_xxx 换成 xxx），联机大厅里不满足，
		 * 没有国战皮肤的武将会找不到 gz_xxx.jpg，所以这里按国战开局时的规则重设一次
		 *
		 * @param { HTMLElement } page
		 */
		const fixGuozhanPortraits = page => {
			const useSkin = lib.config.mode_config?.guozhan?.guozhanSkin ?? true;
			for (const button of page.querySelectorAll(".button.character")) {
				const name = button.link;
				button.setBackground(useSkin && lib.character[name]?.hasSkinInGuozhan ? name : name.slice(3), "character");
			}
		};

		/**
		 * “仅国战标准”按钮的预设：以国战标准系列为基础，再增减个别武将
		 *
		 * 想调整这份预设，改这里即可（武将填国战武将名，即带 gz_ 前缀的名字）。
		 */
		const GUOZHAN_STANDARD_PRESET = {
			/** 开启的分类：国战标准、君临天下·阵/势/变（不含·权） */
			sorts: ["guozhan_default", "guozhan_zhen", "guozhan_shi", "guozhan_bian"],
			/** 额外开启的武将：法正、张绣（君临天下·权），鲁芝、界吕布、马云騄（他山之石），蒋干（十周年专属） */
			enable: ["gz_fazheng", "gz_zhangxiu", "gz_luzhi", "gz_re_lvbu", "gz_mayunlu", "gz_jianggan"],
			/** 额外关闭的武将：左慈（君临天下·变） */
			disable: ["gz_zuoci"],
		};

		/**
		 * 按 connect_guozhan_banned 刷新页面：武将的禁用样式，以及每个分类开关（分类里的武将全部可用才显示为开启）
		 *
		 * @param { HTMLElement } page
		 */
		const syncGuozhanState = page => {
			const sorts = lib.characterSort.mode_guozhan;
			const banned = lib.config.connect_guozhan_banned;
			for (const toggle of page.querySelectorAll(".config.toggle")) {
				const sort = toggle._link?.config?._name;
				if (sort in sorts) {
					toggle.classList.toggle(
						"on",
						sorts[sort].every(name => !banned.includes(name))
					);
				}
			}
			for (const child of page.childNodes) {
				child.updateBanned?.();
			}
		};

		/**
		 * 按分类批量设置国战武将的禁用状态，并保存（只改数据，界面由调用方刷新）
		 *
		 * @param { (sort: string) => boolean } isOn - 每个分类是否开启
		 * @param { { enable?: string[], disable?: string[] } } [extra] - 在分类的基础上，额外开启/关闭的武将
		 */
		const applyGuozhanSelection = (isOn, { enable = [], disable = [] } = {}) => {
			const sorts = lib.characterSort.mode_guozhan;
			const banned = lib.config.connect_guozhan_banned;
			// 个别武将同时被列在多个分类里（如界太史慈），所以先禁后开，保证开启的分类里的武将一定可用
			for (const sort in sorts) {
				if (!isOn(sort)) {
					banned.addArray(sorts[sort]);
				}
			}
			for (const sort in sorts) {
				if (isOn(sort)) {
					banned.removeArray(sorts[sort]);
				}
			}
			banned.removeArray(enable);
			banned.addArray(disable);
			game.saveConfig("connect_guozhan_banned", banned);
		};

		const applyGuozhanStandardPreset = () => applyGuozhanSelection(sort => GUOZHAN_STANDARD_PRESET.sorts.includes(sort), GUOZHAN_STANDARD_PRESET);

		/**
		 * 第一次使用时（从没保存过国战武将设置），默认套用“仅国战标准”；
		 * 之后不再自动套用，哪怕用户把它改成了“全部开启”
		 */
		const initGuozhanDefault = () => {
			if (lib.config.connect_guozhan_banned_inited) {
				return;
			}
			game.saveConfig("connect_guozhan_banned_inited", true);
			if (lib.config.connect_guozhan_banned.length == 0) {
				applyGuozhanStandardPreset();
			}
		};

		/**
		 * 在“国战武将”页顶部加一排一键按钮，批量开启/关闭分类，并提示可以单独点武将开关
		 *
		 * @param { HTMLElement } page
		 */
		const addGuozhanBulkButtons = page => {
			/**
			 * @param { (sort: string) => boolean } isOn - 每个分类是否开启
			 * @param { { enable?: string[], disable?: string[] } } [extra] - 在分类的基础上，额外开启/关闭的武将
			 */
			const apply = (isOn, extra) => {
				applyGuozhanSelection(isOn, extra);
				syncGuozhanState(page);
			};

			const bar = ui.create.div();
			bar.style.cssText = "position:relative;display:flex;flex-wrap:wrap;gap:6px;clear:both;padding:4px 0 4px 4px;";
			page.insertBefore(bar, page.firstChild);
			ui.create.div(".menubutton.pointerdiv", "全部开启", bar, () => apply(() => true));
			ui.create.div(".menubutton.pointerdiv", "全部关闭", bar, () => apply(() => false));
			ui.create.div(".menubutton.pointerdiv", "仅国战标准", bar, () => apply(sort => GUOZHAN_STANDARD_PRESET.sorts.includes(sort), GUOZHAN_STANDARD_PRESET));
			for (const button of bar.childNodes) {
				button.style.cssText = "position:static;flex:none;margin:0;width:auto;height:auto;padding:3px 8px;font-size:14px;line-height:20px;white-space:nowrap;";
			}

			const hint = ui.create.div();
			hint.style.cssText = "clear:both;padding:0 0 6px 6px;font-size:12px;opacity:0.7;";
			hint.innerHTML = "点击武将可单独开启/关闭";
			page.insertBefore(hint, bar.nextSibling);
		};

		/**
		 * @param { HTMLElement } page
		 */
		const decorateGuozhanPage = page => {
			fixGuozhanPortraits(page);
			addGuozhanBulkButtons(page);
			syncGuozhanState(page);
		};

		toggleGuozhanCharacter = button => {
			const banned = lib.config.connect_guozhan_banned;
			const name = button.link;
			if (banned.includes(name)) {
				banned.remove(name);
			} else {
				banned.add(name);
			}
			game.saveConfig("connect_guozhan_banned", banned);
			if (guozhanNode?.link) {
				syncGuozhanState(guozhanNode.link);
			}
		};

		syncGuozhanPage = function () {
			const isGuozhan = getSelectedMode() == "guozhan";
			if (guozhanNode) {
				guozhanNode.style.display = isGuozhan ? "" : "none";
				if (!isGuozhan && guozhanNode.classList.contains("active")) {
					const next = [...start.firstChild.children].find(node => node.mode && node !== guozhanNode && node.style.display != "none");
					if (next) {
						clickMode.call(next);
					}
				}
				return;
			}
			if (!isGuozhan || guozhanLoading) {
				return;
			}
			guozhanLoading = true;
			loadGuozhanPack()
				.then(() => {
					initGuozhanDefault();
					guozhanNode = createModeConfig("mode_guozhan", start.firstChild, start.firstChild.firstChild);
					if (guozhanNode.link) {
						decorateGuozhanPage(guozhanNode.link);
					} else {
						const initLink = guozhanNode._initLink;
						guozhanNode._initLink = function () {
							initLink.call(this);
							decorateGuozhanPage(this.link);
						};
					}
					syncGuozhanPage();
				})
				.catch(e => {
					console.error("联机建房：加载国战武将页失败", e);
				})
				.finally(() => {
					guozhanLoading = false;
				});
		};
		syncGuozhanPage();
		// updateActive 是全局回调，联机时会被另一个菜单覆盖，所以直接监听“模式”列表的点击来同步
		const modeList = cacheMenux.pages[0]?.firstChild;
		if (modeList) {
			for (const type of ["click", "touchend"]) {
				modeList.addEventListener(type, () => syncGuozhanPage());
			}
		}
	}

	/**
	 * 在菜单栏初始化完成后，如果又加载了武将包，进行刷新
	 *
	 * @param { string } packName
	 */
	return function (packName) {
		// 判断菜单栏有没有加载过这个武将包
		if ([...start.firstChild.children].map(node => node.mode).includes(packName)) {
			return;
		}
		// 显示不是无名杀自带的武将包
		if (!lib.connectCharacterPack.includes(packName) && !lib.config.all.characters.includes(packName)) {
			createModeConfig(packName, start.firstChild, node1);
			if (connectMenu) {
				lib.connectCharacterPack.add(packName);
			}
		}
	};
};
