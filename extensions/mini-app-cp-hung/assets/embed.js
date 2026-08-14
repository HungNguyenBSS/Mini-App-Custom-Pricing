(function () {
	function formatMoney(cents, format) {
		if (typeof cents === "string") cents = cents.replace(".", "");
		var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
		var formatString = format || "${{amount}}";

		function defaultOption(opt, def) {
			return opt === undefined || opt === null ? def : opt;
		}

		function formatWithDelimiters(number, precision, thousands, decimal) {
			precision = defaultOption(precision, 2);
			thousands = defaultOption(thousands, ",");
			decimal = defaultOption(decimal, ".");

			if (isNaN(number) || number == null) return "0";

			number = (number / 100.0).toFixed(precision);
			var parts = number.split(".");
			var dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + thousands);
			var cents2 = parts[1] ? decimal + parts[1] : "";
			return dollars + cents2;
		}

		var match = formatString.match(placeholderRegex);
		switch (match ? match[1] : "amount") {
			case "amount":
				return formatString.replace(placeholderRegex, formatWithDelimiters(cents, 2));
			case "amount_no_decimals":
				return formatString.replace(placeholderRegex, formatWithDelimiters(cents, 0));
			case "amount_with_comma_separator":
				return formatString.replace(placeholderRegex, formatWithDelimiters(cents, 2, ".", ","));
			case "amount_no_decimals_with_comma_separator":
				return formatString.replace(placeholderRegex, formatWithDelimiters(cents, 0, ".", ","));
			default:
				return formatString.replace(placeholderRegex, formatWithDelimiters(cents, 2));
		}
	}

	function matchRule(rules, productTags) {
		var tags = productTags.map(function (tag) {
			return tag.toLowerCase();
		});

		var matched = rules.filter(function (rule) {
			if (rule.applyTo === "all") return true;
			var ruleTags = (rule.tags || []).map(function (tag) {
				return tag.toLowerCase();
			});
			return ruleTags.every(function (tag) {
				return tags.indexOf(tag) !== -1;
			});
		});

		matched.sort(function (a, b) {
			return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
		});

		return matched[0];
	}

	function computePrice(original, rule) {
		if (!rule) return original;
		var amount = rule.amount || 0;
		if (rule.priceType === "fixed") return amount * 100;
		if (rule.priceType === "decrease_amount") return Math.max(0, original - amount * 100);
		if (rule.priceType === "decrease_percent") return Math.max(0, original - (original * amount) / 100);
		return original;
	}

	function applyPricing(embed) {
		var rulesEl = embed.querySelector("[data-cp-rules]");
		var productEl = embed.querySelector("[data-cp-product]");
		var moneyFormatEl = embed.querySelector("[data-cp-money-format]");
		if (!rulesEl || !productEl || !moneyFormatEl) return;

		var rules = JSON.parse(rulesEl.textContent || "null") || [];
		var product = JSON.parse(productEl.textContent || "{}");
		var moneyFormat = JSON.parse(moneyFormatEl.textContent || '"${{amount}}"');
		var rule = matchRule(rules, product.tags || []);
		if (!rule) return;

		var selector = embed.getAttribute("data-cp-selector");
		if (!selector) return;

		var scope = document.querySelector(".product__info-wrapper") || document;
		var priceEl = scope.querySelector(selector);
		if (!priceEl || priceEl.dataset.cpApplied) return;

		var originalText = priceEl.textContent.trim();
		var newPriceText = formatMoney(computePrice(product.price, rule), moneyFormat);

		priceEl.style.display = "inline-flex";
		priceEl.style.flexWrap = "wrap";
		priceEl.style.gap = "6px";
		priceEl.style.alignItems = "baseline";

		priceEl.innerHTML =
			'<s class="cp-original-price" style="opacity:0.6;font-weight:normal;white-space:nowrap;font-size:inherit;">' +
			originalText +
			"</s>" +
			'<span class="cp-new-price" style="color:#d82c0d;font-weight:500;white-space:nowrap;font-size:inherit;">' +
			newPriceText +
			"</span>";
		priceEl.dataset.cpApplied = "true";
	}

	function init() {
		try {
			var embed = document.querySelector(".cp-pricing-embed");
			if (!embed) return;
			console.log("Hello from Hung");
			applyPricing(embed);
		} catch (err) {
			console.error("[Custom Pricing] Failed to apply rule:", err);
		}
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();