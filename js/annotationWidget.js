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

var hic = (function (hic) {

    hic.AnnotationWidget = function (browser, $parent, title, trackListRetrievalCallback) {

        var $container;

        this.browser = browser;
        this.trackListRetrievalCallback = trackListRetrievalCallback;

        $container = $("<div>", { class: 'hic-annotation-presentation-button-container' });
        $parent.append($container);

        annotationPresentationButton.call(this, $container, title);

        annotationPanel.call(this, this.browser.$root, title);

    };

    hic.AnnotationWidget.prototype.updateBody = function (tracks) {

        var self = this,
            trackRenderers,
            isTrack2D,
            zi;

        self.$annotationPanel.find('.hic-annotation-row-container').remove();

        isTrack2D = (_.first(tracks) instanceof hic.Track2D);

        if (isTrack2D) {
            // Reverse list to present layers in "z" order.
            for(zi = tracks.length - 1; zi >= 0; zi--) {
                annotationPanelRow.call(self, self.$annotationPanel, tracks[ zi ]);
            }
        } else {
            trackRenderers = tracks;
            _.each(trackRenderers, function (trackRenderer) {
                annotationPanelRow.call(self, self.$annotationPanel, trackRenderer);
            });
        }

    };

    function annotationPresentationButton($parent, title) {
        var self = this,
            $button;

        $button = $('<button>', { type: 'button' });
        $button.text(title);
        $parent.append($button);

        $button.on('click', function () {
            self.updateBody(self.trackListRetrievalCallback());
            self.$annotationPanel.toggle();
            self.browser.hideMenu();
        });
    }

    function annotationPanel($parent, title) {

        var self = this,
            $panel_header,
            $div,
            $fa;

        this.$annotationPanel = $('<div>', { class:'hic-annotation-panel-container' });
        $parent.append(this.$annotationPanel);

        // close button container
        $panel_header = $('<div>', { class:'hic-annotation-panel-header' });
        this.$annotationPanel.append($panel_header);

        // panel title
        $div = $('<div>');
        $div.text(title);
        $panel_header.append($div);

        // close button
        $div = $('<div>', { class:'hic-menu-close-button' });
        $panel_header.append($div);

        $fa = $("<i>", { class:'fa fa-times' });
        $div.append($fa);

        $fa.on('click', function (e) {
            self.$annotationPanel.toggle();
        });

        this.$annotationPanel.draggable();
        this.$annotationPanel.hide();
    }

    function annotationPanelRow($container, track) {
        var self = this,
            $row_container,
            $row,
            $hideShowTrack,
            $deleteTrack,
            $upTrack,
            $downTrack,
            $e,
            $o,
            hidden_color = '#f7f7f7',
            str,
            isTrack2D,
            trackList,
            xyTrackRendererPair,
            trackRenderer,
            track1D,
            index,
            upp,
            dwn;

        isTrack2D = (track instanceof hic.Track2D);
        trackList = this.trackListRetrievalCallback();

        if (false === isTrack2D) {
            xyTrackRendererPair = track;
            track1D = xyTrackRendererPair.x.track;
            trackRenderer = xyTrackRendererPair.x.track.trackView;
        }

        // row container
        $row_container = $('<div>', {class: 'hic-annotation-row-container'});
        $container.append($row_container);

        // one row
        $row = $('<div>', {class: 'hic-annotation-modal-row'});
        $row_container.append($row);

        // track name
        $e = $("<div>");
        $e.text(isTrack2D ? track.config.name : track1D.config.name);
        $row.append($e);



        // track hide/show
        if (isTrack2D) {

            str = (true === track.isVisible) ? 'fa fa-eye fa-lg' : 'fa fa-eye-slash fa-lg';
            $hideShowTrack = $("<i>", {class: str, 'aria-hidden': 'true'});
            $row.append($hideShowTrack);
            $hideShowTrack.on('click', function (e) {

                if ($hideShowTrack.hasClass('fa-eye')) {
                    $hideShowTrack.addClass('fa-eye-slash');
                    $hideShowTrack.removeClass('fa-eye');
                    track.isVisible = false;
                } else {
                    $hideShowTrack.addClass('fa-eye');
                    $hideShowTrack.removeClass('fa-eye-slash');
                    track.isVisible = true;
                }

                self.browser.contactMatrixView.clearCaches();
                self.browser.contactMatrixView.update();

            });

        }



        // color swatch selector button
        $e = hic.colorSwatch(isTrack2D ? track.color : track1D.color);
        $row.append($e);
        $e.on('click', function (e) {
            $row.next('.hic-color-swatch-container').toggle();
        });

        // color swatch selector
        $e = $('<div>', { class: 'hic-color-swatch-container' });
        $row_container.append($e);

        hic.createColorSwatchSelector($e, function (color) {
            var $swatch;

            $swatch = $row.find('.fa-square');
            $swatch.css({color: color});

            if (isTrack2D) {
                track.color = color;
                self.browser.eventBus.post(hic.Event('TrackState2D', track));
            } else {
                trackRenderer.setColor(color);
                self.browser.updateUriParameters();
            }

        }, function () {
            $row.next('.hic-color-swatch-container').toggle();
        });
        $e.hide();



        // track up/down
        $e = $('<div>', {class: 'up-down-arrow-container'});
        $row.append($e);

        $upTrack = $("<i>", {class: 'fa fa-arrow-up', 'aria-hidden': 'true'});
        $e.append($upTrack);

        $downTrack = $("<i>", {class: 'fa fa-arrow-down', 'aria-hidden': 'true'});
        $e.append($downTrack);

        if (1 === _.size(trackList)) {
            $upTrack.css('color', hidden_color);
            $downTrack.css('color', hidden_color);
        } else if (track === _.first(trackList)) {
            $o = isTrack2D ? $downTrack : $upTrack;
            $o.css('color', hidden_color);
        } else if (track === _.last(trackList)) {
            $o = isTrack2D ? $upTrack : $downTrack;
            $o.css('color', hidden_color);
        }

        index = _.indexOf(trackList, track);

        upp = function (e) {

            track = trackList[(index + 1)];
            trackList[(index + 1)] = trackList[index];
            trackList[index] = track;
            if (isTrack2D) {
                self.browser.eventBus.post(hic.Event('TrackState2D', trackList));
                self.updateBody(trackList);
            } else {
                self.browser.updateUriParameters();
                self.browser.updateLayout();
                self.updateBody(trackList);
            }
        };

        dwn = function (e) {

            track = trackList[(index - 1)];
            trackList[(index - 1)] = trackList[index];
            trackList[index] = track;
            if (isTrack2D) {
                self.browser.eventBus.post(hic.Event('TrackState2D', trackList));
                self.updateBody(trackList);
            } else {
                self.browser.updateUriParameters();
                self.browser.updateLayout();
                self.updateBody(trackList);
            }
        };

        $upTrack.on('click', isTrack2D ? upp : dwn);

        $downTrack.on('click', isTrack2D ? dwn : upp);



        // track delete
        $deleteTrack = $("<i>", {class: 'fa fa-trash-o fa-lg', 'aria-hidden': 'true'});
        $row.append($deleteTrack);
        $deleteTrack.on('click', function (e) {
            var index;

            if (isTrack2D) {

                index = _.indexOf(trackList, track);

                trackList.splice(index, 1);

                self.browser.contactMatrixView.clearCaches();
                self.browser.contactMatrixView.update();

                self.browser.eventBus.post(hic.Event('TrackLoad2D', trackList));
            } else {
                self.browser.layoutController.removeTrackRendererPair(trackRenderer.trackRenderPair);
            }

            self.updateBody(trackList);
        });
    }

    return hic;
})(hic || {});

