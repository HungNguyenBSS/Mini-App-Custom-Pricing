(function () {
    function formatMoney(cents, format) {
        if (typeof cents === "string") cents = cents.replace(".", "");
        var value = "";
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
            var dollars = parts[0].replace(
                /(\d)(?=(\d\d\d)+(?!\d))/g,
                "$1" + thousands,
            );
            var cents2 = parts[1] ? decimal + parts[1] : "";

            return dollars + cents2;
        }

        switch (formatString.match(placeholderRegex)[1]) {
            case "amount":
                value = formatWithDelimiters(cents, 2);
                break;
            case "amount_no_decimals":
                value = formatWithDelimiters(cents, 0);
                break;
            case "amount_with_comma_separator":
                value = formatWithDelimiters(cents, 2, ".", ",");
                break;
            case "amount_no_decimals_with_comma_separator":
                value = formatWithDelimiters(cents, 0, ".", ",");
                break;
            default:
                value = formatWithDelimiters(cents, 2);
        }

        return formatString.replace(placeholderRegex, value);
    }

    function matchRule(rules, productTags) {
        var tags = productTags.map(function (t) {
            return t.toLowerCase();
        });

        var matched = rules.filter(function (rule) {
            if (rule.applyTo === "all") return true;
            var ruleTags = (rule.tags || []).map(function (t) {
                return t.toLowerCase();
            });
            return ruleTags.every(function (t) {
                return tags.indexOf(t) !== -1;
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
        if (rule.priceType === "decrease_amount")
            return Math.max(0, original - amount * 100);
        if (rule.priceType === "decrease_percent")
            return Math.max(0, original - (original * amount) / 100);
        return original;
    }

    function init() {
        var blocks = document.querySelectorAll(".cp-pricing-block");
        blocks.forEach(function (block) {
            try {
                var rulesEl = block.querySelector("[data-cp-rules]");
                var productEl = block.querySelector("[data-cp-product]");
                var moneyFormatEl = block.querySelector("[data-cp-money-format]");

                var rules = JSON.parse(rulesEl.textContent || 'null') || [];
                var product = JSON.parse(productEl.textContent || "{}");
                var moneyFormat = JSON.parse(moneyFormatEl.textContent || '"${{amount}}"');

                var rule = matchRule(rules, product.tags || []);
                if (!rule) return;

                var newPriceCents = computePrice(product.price, rule);
                var selector = block.getAttribute("data-cp-selector");
                if (!selector) return;

                var scope =
                    document.querySelector(".product__info-wrapper") ||
                    block.closest('[id^="shopify-section-"]') ||
                    document;
                var priceEl = scope.querySelector(selector);
                if (priceEl && !priceEl.dataset.cpApplied) {
                    var originalText = priceEl.textContent.trim();
                    var newPriceText = formatMoney(newPriceCents, moneyFormat);

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
            } catch (err) {
                console.error("[Custom Pricing] Failed to apply rule:", err);
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();