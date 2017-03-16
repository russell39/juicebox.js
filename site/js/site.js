/**
 * Created by Jim Robinson on 3/4/17.
 */
 var hic = (function (hic) {
 	hic.initSite = function () {

 		var browser = hic.createBrowser($('#app-container'), {});

 		$(function () {
 			$("#dataset_selector").combobox({
 				change: function () {
 					browser.loadHicFile({ url: this.value });
 				}
 			});

 			$("#toggle").click(function () {
 				$("#dataset_selector").toggle();
 			});
 		});

 		var site =
 		{
 			receiveEvent: function (event) {
 				if (event.type === "DataLoad") {
 					var config = event.config,
 					selector = '#dataset_selector option[value="' + config.url + '"]',
 					$option = $(selector);

 					if ($option) $option.prop('selected', true);
 				}
 			}
 		}

 		hic.GlobalEventBus.subscribe("DataLoad", site);
 	}

 	return hic;

 })
 (hic || {});
