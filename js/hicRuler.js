/*
 *  The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 The Regents of the University of California
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */


/**
 * @author Jim Robinson
 */

var hic = (function (hic) {

    hic.Ruler = function (browser, axis, $parent) {
        var id;

        this.browser = browser;
        this.axis = axis;

        id = browser.id + '_' + this.axis + '-axis';
        this.$axis = $("<div>", { id:id });
        $parent.append(this.$axis);


        this.$canvas = $('<canvas>');
        this.$axis.append(this.$canvas);

        this.$canvas.width(        this.$axis.width());
        this.$canvas.attr('width', this.$axis.width());

        this.$canvas.height(        this.$axis.height());
        this.$canvas.attr('height', this.$axis.height());

        this.ctx = this.$canvas.get(0).getContext("2d");

        this.yAxisTransformWithContext = function(context) {
            context.scale(-1, 1);
            context.rotate(Math.PI/2.0);
        };

        this.setAxisTransform(axis);

        this.browser.eventBus.subscribe('LocusChange', this);
        this.browser.eventBus.subscribe('MapLoad', this);

    };

    hic.Ruler.prototype.wholeGenomeLayout = function ($axis, axis, dataset) {

        var self = this,
            list,
            dimen,
            extent,
            cumulativeOffset,
            chrLast,
            scraps,
            $div,
            $e;

        // discard current tiles
        $axis.find('div').remove();

        list = _.filter(dataset.chromosomes, function (chr) {
            return 'all' !== chr.name.toLowerCase();
        });

        chrLast = _.last(dataset.chromosomes);
        cumulativeOffset = this.browser.genome.getCumulativeOffset(chrLast);
        extent = chrLast.bpLength + cumulativeOffset;

        dimen = 'x' === axis ? $axis.width() : $axis.height();
        scraps = 0;
        _.each(list, function (chr) {
            var d,
                percentage;

            percentage = (chr.bpLength)/extent;

            if (percentage * dimen < 1.0) {
                scraps += percentage;
            } else {
                $div = $('<div>');
                $axis.append($div);

                if ('x' === axis) {
                    d = Math.round(percentage * dimen);
                    //console.log(chr.name + "  " + chr.bpLength + "  " + percentage + " " + d + " " + dimen);
                    $div.width(d - 2);
                } else {
                    d = Math.round(percentage * dimen);
                    $div.height(d - 2);

                }

                $e = $('<div>');
                $div.append($e);
                $e.text(chr.name);

            }

        });

        scraps *= dimen;
        scraps = Math.floor(scraps);
        if (scraps >= 1) {

            $div = $('<div>');
            $axis.append($div);

            $div.width(scraps);

            $e = $('<span>');
            $div.append($e);

            $e.text('-');

        }

        // initially hide
        this.hideWholeGenome();

    };

    hic.Ruler.prototype.hideWholeGenome = function () {
        this.$axis.find('div').hide();
        this.$canvas.show();
    };

    hic.Ruler.prototype.showWholeGenome = function () {
        this.$canvas.hide();
        this.$axis.find('div').show();
    };

    hic.Ruler.prototype.setAxisTransform = function (axis) {

        this.canvasTransform = ('y' === axis) ? this.yAxisTransformWithContext : identityTransformWithContext;

        this.labelReflectionTransform = ('y' === axis) ? reflectionTransformWithContext : function (context, exe) { };

    };

    hic.Ruler.prototype.receiveEvent = function(event) {

        if ('LocusChange' === event.type) {

            if (0 === event.data.state.chr1 && event.data.state.chr1 === event.data.state.chr1) {
                this.showWholeGenome();
            } else {
                this.hideWholeGenome();
                this.update();
            }

        } else if ('MapLoad' === event.type) {
            this.wholeGenomeLayout(this.$axis, this.axis, event.data);
        }

    };

    hic.Ruler.prototype.updateWidthWithCalculation = function (calc) {

        this.$axis.css( 'width', calc );

        this.$canvas.width(        this.$axis.width());
        this.$canvas.attr('width', this.$axis.width());

        this.wholeGenomeLayout(this.$axis, this.axis, this.browser.dataset);

        this.update();
    };

    hic.Ruler.prototype.updateHeight = function (height) {

        this.$canvas.height(        height);
        this.$canvas.attr('height', height);

        this.wholeGenomeLayout(this.$axis, this.axis, this.browser.dataset);

        this.update();
    };

    hic.Ruler.prototype.update = function () {

        var w,
            h,
            bin,
            config = {},
            browser = this.browser;

        identityTransformWithContext(this.ctx);
        igv.graphics.fillRect(this.ctx, 0, 0, this.$canvas.width(), this.$canvas.height(), { fillStyle: igv.rgbColor(255, 255, 255) });

        this.canvasTransform(this.ctx);

        w = ('x' === this.axis) ? this.$canvas.width() : this.$canvas.height();
        h = ('x' === this.axis) ? this.$canvas.height() : this.$canvas.width();

        igv.graphics.fillRect(this.ctx, 0, 0, w, h, { fillStyle: igv.rgbColor(255, 255, 255) });

        config.bpPerPixel = browser.dataset.bpResolutions[ browser.state.zoom ] / browser.state.pixelSize;

        bin = ('x' === this.axis) ? browser.state.x : browser.state.y;
        config.bpStart = bin * browser.dataset.bpResolutions[ browser.state.zoom ];

        config.rulerTickMarkReferencePixels = Math.max(Math.max(this.$canvas.width(), this.$canvas.height()), Math.max(this.$otherRulerCanvas.width(), this.$otherRulerCanvas.height()));

        config.rulerLengthPixels = w;
        config.rulerHeightPixels = h;

        config.height = Math.min(this.$canvas.width(), this.$canvas.height());

        this.draw(config);
    };

    hic.Ruler.prototype.draw = function (options) {

        var self = this,
            fontStyle,
            tickSpec,
            majorTickSpacing,
            nTick,
            pixelLast,
            pixel,
            tickSpacingPixels,
            labelWidthPixels,
            modulo,
            l,
            yShim,
            tickHeight,
            rulerLabel,
            chrSize,
            chrName,
            chromosomes = this.browser.dataset.chromosomes;

        chrName = ('x' === this.axis) ? chromosomes[ this.browser.state.chr1 ].name : chromosomes[ this.browser.state.chr2 ].name;
        chrSize = ('x' === this.axis) ? chromosomes[ this.browser.state.chr1 ].size : chromosomes[ this.browser.state.chr2 ].size;

        if (options.chrName === "all") {
            // drawAll.call(this);
        } else {

            igv.graphics.fillRect(this.ctx, 0, 0, options.rulerLengthPixels, options.rulerHeightPixels, { fillStyle: igv.rgbColor(255, 255, 255) });

            fontStyle = {
                textAlign: 'center',
                font: '9px PT Sans',
                fillStyle: "rgba(64, 64, 64, 1)",
                strokeStyle: "rgba(64, 64, 64, 1)"
            };

            tickSpec = findSpacing(Math.floor(options.rulerTickMarkReferencePixels * options.bpPerPixel));
            majorTickSpacing = tickSpec.majorTick;

            // Find starting point closest to the current origin
            nTick = Math.floor(options.bpStart / majorTickSpacing) - 1;

            pixel = pixelLast = 0;

            igv.graphics.setProperties(this.ctx, fontStyle);
            this.ctx.lineWidth = 1.0;

            yShim = 1;
            tickHeight = 8;
            while (pixel < options.rulerLengthPixels) {

                l = Math.floor(nTick * majorTickSpacing);

                pixel = Math.round(((l - 1) - options.bpStart + 0.5) / options.bpPerPixel);

                rulerLabel = formatNumber(l / tickSpec.unitMultiplier, 0) + " " + tickSpec.majorUnit;

                tickSpacingPixels = Math.abs(pixel - pixelLast);
                labelWidthPixels = this.ctx.measureText(rulerLabel).width;

                if (labelWidthPixels > tickSpacingPixels) {

                    if (tickSpacingPixels < 32) {
                        modulo = 4;
                    } else {
                        modulo = 2;
                    }
                } else {
                    modulo = 1;
                }

                // modulo = 1;
                if (0 === nTick % modulo) {

                    if (Math.floor((pixel * options.bpPerPixel) + options.bpStart) < chrSize) {

                        // console.log('   label delta(' + Math.abs(pixel - pixelLast) + ') modulo(' + modulo + ') bpp(' + options.bpPerPixel + ')');

                        this.ctx.save();
                        this.labelReflectionTransform(this.ctx, pixel);
                        igv.graphics.fillText(this.ctx, rulerLabel, pixel, options.height - (tickHeight / 0.75));
                        this.ctx.restore();

                    }

                } else {
                    // console.log('no label');
                }

                if (Math.floor((pixel * options.bpPerPixel) + options.bpStart) < chrSize) {
                    igv.graphics.strokeLine(this.ctx,
                        pixel, options.height - tickHeight,
                        pixel, options.height - yShim);
                }

                pixelLast = pixel;
                nTick++;

            } // while (pixel < options.rulerLengthPixels)

            igv.graphics.strokeLine(this.ctx, 0, options.height - yShim, options.rulerLengthPixels, options.height - yShim);

        }

        function formatNumber(anynum, decimal) {
            //decimal  - the number of decimals after the digit from 0 to 3
            //-- Returns the passed number as a string in the xxx,xxx.xx format.
            //anynum = eval(obj.value);
            var divider = 10;
            switch (decimal) {
                case 0:
                    divider = 1;
                    break;
                case 1:
                    divider = 10;
                    break;
                case 2:
                    divider = 100;
                    break;
                default:       //for 3 decimal places
                    divider = 1000;
            }

            var workNum = Math.abs((Math.round(anynum * divider) / divider));

            var workStr = "" + workNum;

            if (-1 === workStr.indexOf(".")) {
                workStr += "."
            }

            var dStr = workStr.substr(0, workStr.indexOf("."));
            var dNum = dStr - 0;
            var pStr = workStr.substr(workStr.indexOf("."));

            while (pStr.length - 1 < decimal) {
                pStr += "0"
            }

            if ('.' === pStr) {
                pStr = '';
            }

            //--- Adds a comma in the thousands place.
            if (dNum >= 1000) {
                var dLen = dStr.length;
                dStr = parseInt("" + (dNum / 1000)) + "," + dStr.substring(dLen - 3, dLen)
            }

            //-- Adds a comma in the millions place.
            if (dNum >= 1000000) {
                dLen = dStr.length;
                dStr = parseInt("" + (dNum / 1000000)) + "," + dStr.substring(dLen - 7, dLen)
            }
            var retval = dStr + pStr;
            //-- Put numbers in parentheses if negative.
            if (anynum < 0) {
                retval = "(" + retval + ")";
            }

            //You could include a dollar sign in the return value.
            //retval =  "$"+retval
            return retval;
        }

        function drawAll() {

            var self = this,
                lastX = 0,
                yShim = 2,
                tickHeight = 10;

            _.each(self.browser.genome.chromosomes, function (chromosome) {

                var chrName = chromosome.name,
                    bp = self.browser.genome.getGenomeCoordinate(chrName, chromosome.size),
                    x = Math.round((bp - options.bpStart ) / options.bpPerPixel),
                    chrLabel = chrName.startsWith("chr") ? chrName.substr(3) : chrName;

                self.ctx.textAlign = 'center';
                igv.graphics.strokeLine(self.ctx, x, self.height - tickHeight, x, self.height - yShim);
                igv.graphics.fillText(self.ctx, chrLabel, (lastX + x) / 2, self.height - (tickHeight / 0.75));

                lastX = x;

            });
            igv.graphics.strokeLine(self.ctx, 0, self.height - yShim, options.rulerLengthPixels, self.height - yShim);
        }

    };

    function TickSpacing(majorTick, majorUnit, unitMultiplier) {
        this.majorTick = majorTick;
        this.majorUnit = majorUnit;
        this.unitMultiplier = unitMultiplier;
    }

    function findSpacing(rulerLengthBP) {

        if (rulerLengthBP < 10) {
            return new TickSpacing(1, "", 1);
        }


        // How many zeroes?
        var nZeroes = Math.floor(log10(rulerLengthBP));
        var majorUnit = "";
        var unitMultiplier = 1;
        if (nZeroes > 9) {
            majorUnit = "gb";
            unitMultiplier = 1000000000;
        }
        if (nZeroes > 6) {
            majorUnit = "mb";
            unitMultiplier = 1000000;
        } else if (nZeroes > 3) {
            majorUnit = "kb";
            unitMultiplier = 1000;
        }

        var nMajorTicks = rulerLengthBP / Math.pow(10, nZeroes - 1);
        if (nMajorTicks < 25) {
            return new TickSpacing(Math.pow(10, nZeroes - 1), majorUnit, unitMultiplier);
        } else {
            return new TickSpacing(Math.pow(10, nZeroes) / 2, majorUnit, unitMultiplier);
        }

        function log10(x) {
            var dn = Math.log(10);
            return Math.log(x) / dn;
        }
    }

    function reflectionTransformWithContext(context, exe) {
        context.translate(exe, 0);
        context.scale(-1, 1);
        context.translate(-exe, 0);
    }

    function identityTransformWithContext(context) {
        // 3x2 matrix. column major. (sx 0 0 sy tx ty).
        context.setTransform(1, 0, 0, 1, 0, 0);
    }

    return hic;
})(hic || {});
