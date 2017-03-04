/*
 * Copyright (c) 2009-2016. Authors: see NOTICE file.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var ProjectDashboardImages = Backbone.View.extend({
    imagesView: null,
    imagesTabsView: null,
    imagesGroupTabsView: null,
    render: function () {

        var self = this;
        require(["text!application/templates/dashboard/ImageTable.tpl.html"
            , "text!application/templates/dashboard/ImageGroupTable.tpl.html"],
            function (imageTableTemplate, imageGroupTableTemplate) {
                self.doLayout(imageTableTemplate, imageGroupTableTemplate);
            });
        return this;
    },
    doLayout: function (imageTableTemplate, imageGroupTableTemplate) {
        var self = this;
        if (this.imagesTabsView == null) {
            this.imagesTabsView = new ImageTabsView({
                model: new ImageInstanceCollection({project: self.model.get('id')}),
                el: _.template(imageTableTemplate, {id : self.model.get('id')}),
                idProject: this.model.id,
                project: this.model
            }).render();
            $(this.el).append(this.imagesTabsView.el);
        }
        if (this.imagesGroupTabsView == null) {
            console.log("ost");
            this.imagesGroupTabsView = new ImageGroupTabsView({
                model: new ImageGroupCollection({project: self.model.get('id')}),
                el: _.template(imageGroupTableTemplate, {id : self.model.get('id')}),
                idProject: this.model.id,
                project: this.model
            }).render();
            $(this.el).append(this.imagesGroupTabsView.el);
        }
    },

    // find a way to integrate this too
    refreshImagesThumbs: function () {
        console.log("refreshImagesThumbs");
        if (this.imagesView == null) {
            this.imagesView = new ImageView({
                page: 0,
                model: new ImageInstanceCollection({project: this.model.get('id')}),
                el: $("#tabs-projectImageThumb" + this.model.get('id')),
                container: window.app.view.components.warehouse
            }).render();
        } else {
            this.imagesView.refresh();
        }
    },
    refreshImagesTable: function () {
        var self = this;
        console.log("refreshImagesTable");
        if (this.imagesTabsView == null) {
            self.render();
        } else {
            console.log("this.imagesTabsView.refresh()");
            //this.imagesTabsView.refresh();
        }
    }
});