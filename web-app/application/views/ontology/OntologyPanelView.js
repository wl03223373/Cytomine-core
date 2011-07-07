var OntologyPanelView = Backbone.View.extend({
       $tree : null,
       $infoOntology : null,
       $infoTerm : null,
       $panel : null,
       $addTerm : null,
       $editTerm : null,
       $deleteTerm : null,
       $buttonAddTerm : null,
       $buttonEditTerm : null,
       $buttonDeleteTerm : null,
       $buttonEditOntology : null,
       $buttonDeleteOntology : null,
       addOntologyTermDialog : null,
       editOntologyTermDialog : null,
       deleteOntologyTermDialog : null,
       ontologiesPanel : null,
       expanse : false,
       events: {
          "click .addTerm": "addTerm",
          "click .editTerm": "editTerm",
          "click .deleteTerm": "deleteTerm",
          "click .editOntology": "editOntology",
          "click .deleteOntology": "deleteOntology"
       },
       initialize: function(options) {
          this.container = options.container;
          this.ontologiesPanel = options.ontologiesPanel;
       },
       render: function() {
          var self = this;
          self.$panel = $(self.el);
          self.$tree = self.$panel.find("#treeontology-"+self.model.id);
          self.$infoOntology = self.$panel.find("#infoontology-"+self.model.id);
          self.$infoTerm = self.$panel.find("#infoterm-"+self.model.id);

          self.$addTerm = self.$panel.find('#dialog-add-ontology-term');
          self.$editTerm = self.$panel.find('#dialog-edit-ontology-term');
          self.$deleteTerm = self.$panel.find('#dialogsTerm');

          self.$buttonAddTerm = self.$panel.find($('#buttonAddTerm'+self.model.id));
          self.$buttonEditTerm = self.$panel.find($('#buttonEditTerm'+self.model.id));
          self.$buttonDeleteTerm = self.$panel.find($('#buttonDeleteTerm'+self.model.id));

          self.$buttonEditOntology = self.$panel.find($('#buttonEditOntology'+self.model.id));
          self.$buttonDeleteOntology = self.$panel.find($('#buttonDeleteOntology'+self.model.id));

          self.buildOntologyTree();
          self.buildButton();
          self.buildInfoOntologyPanel();
          self.buildInfoTermPanel();

          return this;
       },

       refresh : function() {
          var self = this;
          self.model.fetch({
                 success : function (model, response) {
                    window.app.models.terms.fetch({
                           success : function (model, response) {

                              $('#ontologyTitle'+self.model.id).empty();
                              $('#ontologyTitle'+self.model.id).append(self.model.get('name'));
                              self.clear();
                              self.render();
                           }});
                 }});


       },

       clear : function() {
          var self = this;
          self.$panel.empty();
          require([
             "text!application/templates/ontology/OntologyTabContent.tpl.html"
          ],
              function(tpl) {
                 self.$panel.html(_.template(tpl, { id : self.model.get("id"), name : self.model.get("name")}));
                 return this;
              });

          return this;
       },

       getCurrentTermId : function() {
          var node = this.$tree.dynatree("getActiveNode");
          if(node==null) return null;
          else return node.data.id;
       },

       addTerm : function() {
          var self = this;
          self.$addTerm.remove();

          self.addOntologyTermDialog = new OntologyAddOrEditTermView({
                 ontologyPanel:self,
                 el:self.el,
                 ontology:self.model,
                 model:null //add component so no term
              }).render();
       },

       editTerm : function() {
          var self = this;
          self.$editTerm.remove();

          var node = self.$tree.dynatree("getActiveNode");

          if(node==null) {
             window.app.view.message("Term", "You must select a term!", "");
             return;
          }

          new TermModel({id:node.data.id}).fetch({
                 success : function (model, response) {
                    self.editOntologyTermDialog = new OntologyAddOrEditTermView({
                           ontologyPanel:self,
                           el:self.el,
                           model:model,
                           ontology:self.model
                        }).render();
                 }});
          return false;
       },


       deleteTerm : function() {
          var self = this;

          var idTerm = self.getCurrentTermId();
          console.log("idTerm="+idTerm);

          var term = window.app.models.terms.get(idTerm);
          console.log("term.name="+term.get('name'));

          new AnnotationCollection({term:idTerm}).fetch({

                 success : function (collection, response) {

                    console.log("term:" + idTerm + " is link with " + collection.length + " annotations");

                    if(collection.length==0) self.buildDeleteTermConfirmDialog(term);
                    else self.buildDeleteTermWithAnnotationConfirmDialog(term,collection.length);
                 }});
       },
       editOntology : function() {
          var self = this;
          $('#editontology').remove();
          self.editOntologyDialog = new EditOntologyDialog({ontologyPanel:self,el:self.el,model:self.model}).render();
       },
       deleteOntology : function() {
          var self = this;
          //check if projects has this ontology
          new ProjectCollection({ontology:self.model.id}).fetch({
                 success:function(collection,response) {
                    if(collection.length>0) self.refuseDeleteOntology(collection.length);
                    else self.acceptDeleteOntology();

                 }})
       },
       refuseDeleteOntology : function(numberOfProject) {
          var self = this;
          $("#delete-ontology-refuse").replaceWith("");
          require(["text!application/templates/ontology/OntologyDeleteRefuseDialog.tpl.html"], function(tpl) {
             var dialog =  new ConfirmDialogView({
                    el:'#dialogsDeleteOntologyRefuse',
                    template : _.template(tpl, {name : self.model.get('name'),numberOfProject:numberOfProject}),
                    dialogAttr : {
                       dialogID : '#dialogsDeleteOntologyRefuse',
                       width : 400,
                       height : 200,
                       buttons: {
                          "close": function() {
                             //doesn't work! :-(
                             $('#dialogsDeleteOntologyRefuse').dialog( "close" ) ;
                          }
                       },
                       close :function (event) {
                       }
                    }
                 }).render();
          });
       },
       acceptDeleteOntology : function() {
          var self = this;
          $("#delete-ontology-confirm").replaceWith("");
          require(["text!application/templates/ontology/OntologyDeleteConfirmDialog.tpl.html"], function(tpl) {
             var dialog =  new ConfirmDialogView({
                    el:'#dialogsDeleteOntologyAccept',
                    template : _.template(tpl, {ontology : self.model.get('name')}),
                    dialogAttr : {
                       dialogID : '#dialogsDeleteOntologyAccept',
                       width : 400,
                       height : 300,
                       buttons: {
                          "Delete ontology and all terms": function() {
                             self.model.destroy({
                                    success : function (model, response) {
                                       $('#dialogsDeleteOntologyAccept').dialog( "close" ) ;
                                       self.ontologiesPanel.refresh();
                                    },error: function (model, response) {
                                       var json = $.parseJSON(response.responseText);
                                    }});

                          },
                          "cancel": function() {
                             //doesn't work! :-(
                             $('#dialogsDeleteOntologyAccept').dialog( "close" ) ;
                          }
                       },
                       close :function (event) {
                       }
                    }
                 }).render();
          });
       },
       selectTerm : function(idTerm) {
          var self = this;
          self.$tree.dynatree("getTree").selectKey(idTerm);
       },

       buildDeleteTermConfirmDialog : function(term) {
          var self = this;
          require(["text!application/templates/ontology/OntologyDeleteTermConfirmDialog.tpl.html"], function(tpl) {
             var dialog =  new ConfirmDialogView({
                    el:'#dialogsTerm',
                    template : _.template(tpl, {term : term.get('name'),ontology : self.model.get('name')}),
                    dialogAttr : {
                       dialogID : '#dialogsTerm',
                       width : 400,
                       height : 300,
                       buttons: {
                          "Delete term": function() {
                             new BeginTransactionModel({}).save({}, {
                                    success: function (model, response) {
                                       self.deleteTermWithoutAnnotationTerm(term);
                                    },
                                    error: function (model, response) {
                                       window.app.view.message("ERROR", "error transaction begin", "error");
                                    }
                                 });
                          },
                          "Cancel": function() {
                             //doesn't work! :-(
                             $('#dialogsTerm').dialog( "close" ) ;
                          }
                       },
                       close :function (event) {
                       }
                    }
                 }).render();
          });
       },
       /**
        * TODO: This method can be merge with  buildDeleteTermWithoutAnnotationConfirmDialog
        * But it's now separete to allow modify with delete term with annotation (which is critical)
        * @param term
        * @param numberOfAnnotation
        */
       buildDeleteTermWithAnnotationConfirmDialog : function(term,numberOfAnnotation) {
          //TODO:ask confirmation (and delete term  with annotation? or not...)
          var self = this;
          require(["text!application/templates/ontology/OntologyDeleteTermWithAnnotationConfirmDialog.tpl.html"], function(tpl) {
             var dialog =  new ConfirmDialogView({
                    el:'#dialogsTerm',
                    template : _.template(tpl, {term : term.get('name'),ontology : self.model.get('name'),numberOfAnnotation:numberOfAnnotation}),
                    dialogAttr : {
                       dialogID : '#dialogsTerm',
                       width : 400,
                       height : 300,
                       buttons: {
                          "Delete all link and delete term": function() {
                             new BeginTransactionModel({}).save({}, {
                                    success: function (model, response) {
                                       self.deleteTermWithAnnotationTerm(term);
                                    },
                                    error: function (model, response) {
                                       window.app.view.message("ERROR", "error transaction begin", "error");
                                    }
                                 });
                          },
                          "Cancel": function() {
                             //doesn't work! :-(
                             $('#dialogsTerm').dialog( "close" ) ;
                          }
                       },
                       close :function (event) {
                       }
                    }
                 }).render();
          });
       },
       /**
        * Delete a term which can have annotation and relation
        * @param term  term that must be deleted
        */
       deleteTermWithAnnotationTerm : function(term) {
          var self = this;
          var counter = 0;
          //delete all annotation term
          new AnnotationCollection({term:term.id}).fetch({
                 success:function (collection, response){
                    if (collection.size() == 0) {
                       self.removeAnnotationTermCallback(0,0, term);
                       return;
                    }
                    collection.each(function(annotation) {
                       new AnnotationTermModel({
                              term:term.id,
                              annotation:annotation.id
                           }).destroy({success : function (model, response) {
                              self.removeAnnotationTermCallback(collection.length, ++counter, term);
                           }});
                    });
                 }
              });
       },
       /**
        * Delete a term which can have relation but no annotation
        * @param term term that must be deleted
        */
       deleteTermWithoutAnnotationTerm : function(term) {
          var self = this;
          var counter = 0;
          //get all relation with this term and remove all of them
          new RelationTermCollection({term:term.id}).fetch({
                 success:function (collection, response){
                    if (collection.size() == 0) {
                       self.removeRelationTermCallback(0,0, term);
                       return;
                    }
                    collection.each(function(item) {
                       var json = item.toJSON();
                       new RelationTermModel({
                              relation:json.relation.id,
                              term1:json.term1.id,
                              term2:json.term2.id
                           }).destroy({success : function (model, response) {
                              self.removeRelationTermCallback(collection.length, ++counter, term);
                           }});

                    });

                 }});
       },
       removeAnnotationTermCallback : function(total, counter, term) {
          var self = this;
          if (counter < total) return;
          //all annotation-term are deleted for this term: delete term like a term with no annotation
          self.deleteTermWithoutAnnotationTerm(term);

       },
       removeRelationTermCallback : function(total, counter, term) {
          var self = this;
          if (counter < total) return;
          //term has no relation, delete term
          new TermModel({id:term.id}).destroy({
                 success : function (model, response) {
                    new EndTransactionModel({}).save();
                    window.app.view.message("Term", response.message, "");
                    self.refresh();
                    $('#dialogsTerm').dialog( "close" ) ;
                 },
                 error: function (model, response) {
                    var json = $.parseJSON(response.responseText);
                    $("#delete-term-error-message").empty();
                    $("#delete-term-error-label").show();
                    $("#delete-term-error-message").append(json.errors)
                 }});
       },

       buildButton : function() {
          var self = this;

          self.$buttonAddTerm.button({
                 icons : {secondary: "ui-icon-plus" }
              });
          self.$buttonEditTerm.button({
                 icons : {secondary: "ui-icon-pencil" }
              });
          self.$buttonDeleteTerm.button({
                 icons : {secondary: "ui-icon-trash" }
              });

          self.$buttonEditOntology.button({
                 icons : {secondary: "ui-icon-pencil" }
              });
          self.$buttonDeleteOntology.button({
                 icons : {secondary: "ui-icon-trash" }
              });


       },
       buildInfoOntologyPanel : function() {
          var self = this;
          //bad code with html but waiting to know what info is needed...
          self.$infoOntology.empty();
          self.$infoOntology.append("<div><br><div id=\"userontologyinfo-"+self.model.id +"\"></div>");

          var idUserOwner = self.model.get('user');
          var userOwner = window.app.models.users.get(idUserOwner);

          $("#userontologyinfo-"+self.model.id).append("<b>Owner:</b><br>");
          $("#userontologyinfo-"+self.model.id).append(""+userOwner.get('username') + "<br>");

          var jsonuser = self.model.get('users');
          $("#userontologyinfo-"+self.model.id).append("<b>User that use this ontology from a project:</b><br>");
          if(jsonuser.length) {
             _.each(jsonuser,
                 function(idUser){
                    var user = window.app.models.users.get(idUser);
                    $("#userontologyinfo-"+self.model.id).append(""+user.get('username') + "<br>");
                 });
          }
          else {
             $("#userontologyinfo-"+self.model.id).append("There are no project that use this ontology." + "<br>");
          }
       },
       buildInfoTermPanel : function() {

       },

       buildOntologyTree : function() {
          var self = this;
          var currentTime = new Date();

          self.$tree.empty();
          self.$tree.dynatree({
                 children: self.model.toJSON(),
                 onExpand : function() { },
                 onClick: function(node, event) {

                    /*var title = node.data.title;
                     var color = "black";
                     var htmlNode = "<a href='#'><label style='color:{{color}}'>{{title}}</label></a>" ;
                     var nodeTpl = _.template(htmlNode, {title : title, color : color});
                     node.setTitle(nodeTpl);  */

                    if(window.app.models.ontologies.get(node.data.id)==undefined)
                       self.updateInfoPanel(node.data.id,node.data.title);
                 },
                 onSelect: function(select, node) {
                    self.updateInfoPanel(node.data.id,node.data.title);
                 },
                 onDblClick: function(node, event) {
                 },
                 onRender: function(node, nodeSpan) {
                    self.$tree.find("a.dynatree-title").css("color", "black");
                 },
                 //generateIds: true,
                 // The following options are only required, if we have more than one tree on one page:
                 initId: "treeDataOntology-"+self.model.id + currentTime.getTime(),
                 cookieId: "dynatree-Ontology-"+self.model.id+ currentTime.getTime(),
                 idPrefix: "dynatree-Ontology-"+self.model.id+ currentTime.getTime()+"-" ,
                 debugLevel: 0
              });
          //expand all nodes
          self.$tree.dynatree("getRoot").visit(function(node){
             node.expand(true);
          });
       },

       updateInfoPanel : function(idTerm,name) {
          var self = this;
          //bad code with html but waiting to know what info is needed...
          self.$infoTerm.empty();
          self.$infoTerm.append("<div id=\"termchart-"+self.model.id +"\"><h3>"+name+"</h3><div id=\"terminfo-"+self.model.id +"\"></div>");

          new TermModel({id:idTerm}).fetch({
                 success : function (model, response) {
                    var tpl = _.template("<a href='#' class='editTerm'>Color : <span name='color' id='color' style='display:inline;background-color: {{color}};'>&nbsp;&nbsp;&nbsp;&nbsp;</span></a><br />", {color : model.get('color')});
                    $("#terminfo-"+self.model.id).append(tpl);
                    var statsCollection = new StatsCollection({term:idTerm});
                    var statsCallback = function(collection, response) {
                       collection.each(function(stat) {
                          $("#terminfo-"+self.model.id).append("Project "+stat.get('key') + ": " + stat.get('value') + " annotations<br>");
                       });

                       $("#termchart-"+self.model.id).panel({
                              collapsible:false
                           });
                    }
                    statsCollection.fetch({
                           success : function(model, response) {
                              statsCallback(model, response); //fonctionne mais très bourrin de tout refaire à chaque fois...
                           }
                        });
                 }});
       }
    });