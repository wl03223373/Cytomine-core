/**
 * Created by IntelliJ IDEA.
 * User: lrollus
 * Date: 26/04/11
 * Time: 14:38
 * To change this template use File | Settings | File Templates.
 */
var ProjectDashboardView = Backbone.View.extend({
       tagName : "div",
       projectElem : "#projectdashboardinfo",  //div with project info
       tabsAnnotation : null,
       images : null,
       imagesView : null, //image view
       imagesTabsView : null,
       imagesThumbOrTab : null, //0=thumb, 1=tab
       annotationsViews : [], //array of annotation view
       maxCommandsView : 10,
       selectedTermTab : 0,
       rendered : false,
       initialize: function(options) {
          this.container = options.container;
          this.imagesThumbOrTab = options.imagesThumbOrTab;
          _.bindAll(this, 'render');
       },
       events: {
       },
       /**
        * Print all information for this project
        */
       render: function() {
          var self = this;
          require(["text!application/templates/dashboard/Dashboard.tpl.html"], function(tpl) {

             self.images = new Array();
             self.doLayout(tpl);
             self.rendered = true;
          });
          return this;
       },
       /**
        * Refresh all information for this project
        */
       refresh : function() {
          var self = this;
          if (!self.rendered) return;

          var projectModel = new ProjectModel({id : self.model.id});
          var projectCallback = function(model, response) {
             console.log(model);
             self.model = model;

             self.fetchProjectInfo();
             /*self.refreshImages();*/

             //refresh selected tab
             console.log("selectedTermTab="+self.selectedTermTab);
             /*self.refreshAnnotations(self.selectedTermTab);*/

             //TODO: must be improve!
             new AnnotationCollection({project:self.model.id}).fetch({
                    success : function (collection, response) {
                       self.fetchCommands(collection);
                    }
                 });


             self.fetchStats();

          }

          projectModel.fetch({
                 success : function(model, response) {
                    projectCallback(model, response); //fonctionne mais très bourrin de tout refaire à chaque fois...
                 }
              });

       },
       /**
        * Init annotation tabs
        */
       initTabs : function(){
          $("#projectcolmunChartPanel").panel({collapsible: true});
          $("#projectPieChartPanel").panel({collapsible: true});
          $("#projectInfoPanel").panel({collapsible: true});
          $("#projectLastCommandPanel").panel({collapsible: true});

          var self = this;
          var idOntology = self.model.get('ontology');
          require(["text!application/templates/dashboard/TermTab.tpl.html", "text!application/templates/dashboard/TermTabContent.tpl.html"], function(termTabTpl, termTabContentTpl) {

             new TermCollection({idOntology:idOntology}).fetch({
                    success : function (collection, response) {
                       //add "All annotation from all term" tab
                       self.addTermToTab(termTabTpl, termTabContentTpl, { id : "all", name : "All"});

                       collection.each(function(term) {
                          //add x term tab
                          self.addTermToTab(termTabTpl, termTabContentTpl, { id : term.get("id"), name : term.get("name")});
                       });

                       if(self.tabsAnnotation==null)
                          self.tabsAnnotation = $("#tabsannotation").tabs({
                                 select: function(event, ui) {
                                    var tabsId = ui.panel.id.split('-');
                                    var id = tabsId[1];
                                    if(id=="all") id = 0;
                                    self.selectedTermTab = id;
                                    self.refreshAnnotations(id);

                                 }
                              });
                       self.fetchAnnotations();
                       self.fetchImages();
                       self.fetchStats();
                       self.fetchProjectInfo();
                       self.initWidgets();
                    }});
          });
       },
       /**
        * Add the the tab with term info
        * @param id  term id
        * @param name term name
        */
       addTermToTab : function(termTabTpl, termTabContentTpl, data) {
          $("#ultabsannotation").append(_.template(termTabTpl, data));
          $("#listtabannotation").append(_.template(termTabContentTpl, data));
       },
       /**
        * Load annotations on annotation tabs
        * -'All' tab: all annotation for this project
        * -'X' tab: all annotation for this project and the term X
        */
       fetchAnnotations : function () {
          console.log("ProjectDashboardView: fetchAnnotations");

          var self = this;

          //init panel for all annotation (with or without term
          new AnnotationCollection({project:self.model.id}).fetch({
                 success : function (collection, response) {
                    $("#tabsterm-all").empty();

                    var view = new AnnotationView({
                           page : undefined,
                           model : collection,
                           el:$("#tabsterm-all"),
                           container : window.app.view.components.warehouse
                        }).render();
                    self.annotationsViews[0] = view;


                    self.fetchCommands(collection);
                 }
              });
       },
       /**
        * Refresh all annotation dor the given term
        * @param term annotation term to be refresh (all = 0)
        */
       refreshAnnotations : function(term) {
          var self = this;
          if(term==0) {
             //refresh all annotation
             self.printAnnotationThumb(term,$("#tabsterm-all"));

          } else {
             //refresh  annotation for the term
             self.printAnnotationThumb(term,$("#tabsterm-"+term));
          }

       },
       /**
        * Print annotation for the given term
        * @param term term annotation term to be refresh (all = 0)
        * @param $elem  elem that will keep all annotations
        */
       printAnnotationThumb : function(term,$elem){
          var self = this;
          console.log("Refresh:"+term);
          var idTerm = 0
          if(term==0) idTerm = undefined
          else idTerm = term
          if(self.annotationsViews[term]==null) {

             new AnnotationCollection({project:self.model.id,term:idTerm}).fetch({
                    success : function (collection, response) {
                       console.log("AnnotationCollection:"+collection.length);
                       $elem.empty();

                       self.annotationsViews[term] = new AnnotationView({
                              page : undefined,
                              model : collection,
                              el:$elem,
                              container : window.app.view.components.warehouse
                           }).render();
                       console.log("Looking for annotationsViews==null " + term);
                       self.annotationsViews[term].refresh(collection);
                    }
                 });
          }
          else {
             new AnnotationCollection({project:self.model.id,term:idTerm}).fetch({
                    success : function (collection, response) {
                       console.log("Looking for annotationsViews!=null " + term);
                       self.annotationsViews[term].refresh(collection);
                    }
                 });
          }
       },
       /**
        * Get and Print ALL images (use for the first time)
        */
       fetchImages : function() {

          console.log("ProjectDashboardView: fetchImages");
          var self = this;
          new ImageInstanceCollection({project:self.model.get('id')}).fetch({
                 success : function (collection, response) {

                    console.log("self.imagesView:"+$("#projectImageThumb"+self.model.get('id')).length);

                    self.imagesView = new ImageView({
                           page : 0,
                           model : collection,
                           el:$("#projectImageThumb"+self.model.get('id')),
                           container : window.app.view.components.warehouse
                        }).render();
                    console.log("self.imagesTabsView"+$("#projectImageListing"+self.model.get('id')).length);
                    self.imagesTabsView = new ImageTabsView({
                           page : 0,
                           model : collection,
                           el:$("#projectImageListing"+self.model.get('id')),
                           container : window.app.view.components.warehouse,
                           idProject : self.model.id
                        }).render();



                    $("#tabs-images-listing-"+ self.model.get('id')).tabs();
                    self.selectTab(self.imagesThumbOrTab);
                 }});

       },
       /**
        * Get and Print only new images and remove delted images
        */
       refreshImages : function() {
          console.log("ProjectDashboardView: refreshImages");
          var self = this;
          if(self.imagesView==null) return; //imageView is not yet build
          new ImageInstanceCollection({project:self.model.get('id')}).fetch({
                 success : function (collection, response) {
                    self.imagesView.refresh(collection);
                 }});
       },
       refreshImagesTabs : function() {
          console.log("ProjectDashboardView: refreshImagesTabs");
          var self = this;
          if(self.imagesTabsView==null) return; //imageView is not yet build
          new ImageInstanceCollection({project:self.model.get('id')}).fetch({
                 success : function (collection, response) {
                    self.imagesTabsView.refresh(collection);
                 }});
       },
       selectTab : function(index) {
          var self = this;
          console.log("select tab for images index " + index);
          $("#tabs-images-listing-"+ self.model.get('id')).tabs( "select" , index );
       } ,
       fetchStats : function () {
          console.log("ProjectDashboardView: fetchStats");
          var self = this;
          var statsCollection = new StatsCollection({project:self.model.get('id')});
          var statsCallback = function(collection, response) {
             $("#projectPieChart").empty();
             var drawPieChart = function () {
                // Create and populate the data table.
                var data = new google.visualization.DataTable();
                data.addColumn('string', 'Term');
                data.addColumn('number', 'Number of annotations');
                data.addRows(_.size(collection));
                var i = 0;
                var colors = [];
                collection.each(function(stat) {
                   colors.push(stat.get('color'));
                   data.setValue(i,0, stat.get('key'));
                   data.setValue(i,1, stat.get('value'));
                   i++;
                });

                // Create and draw the visualization.
                new google.visualization.PieChart(document.getElementById('projectPieChart')).
                    draw(data, {width: 500, height: 350,title:"Annotation repartition", colors : colors});
             }
             var drawColumnChart = function () {
                $("#projectColumnChart").empty();
                var dataToShow = false;
                // Create and populate the data table.
                var data = new google.visualization.DataTable();

                data.addRows(_.size(collection));

                data.addColumn('string', 'Number');
                data.addColumn('number', 0);
                var colors = [];
                var j = 0;
                collection.each(function(stat) {
                   colors.push(stat.get('color'));
                   if (stat.get('value') > 0) dataToShow = true;
                   data.setValue(j, 0, stat.get("key"));
                   data.setValue(j, 1, stat.get("value"));
                   j++;
                });

                // Create and draw the visualization.
                new google.visualization.ColumnChart(document.getElementById("projectColumnChart")).
                    draw(data,
                    {title:"Annotations by projects",
                       width:500, height:350,
                       vAxis: {title: "Number of annotations"},
                       hAxis: {title: "Terms"}}
                );
                $("#projectColumnChart").show();

             };

             drawPieChart();
             drawColumnChart();
             /*google.setOnLoadCallback(drawVisualization);*/



          }

          statsCollection.fetch({
                 success : function(model, response) {
                    statsCallback(model, response); //fonctionne mais très bourrin de tout refaire à chaque fois...
                 }
              });

       },

       fetchProjectInfo : function () {
          var self = this;
          var json = self.model.toJSON();
          var idOntology = json.ontology;

          //Get ontology name
          //json.ontology = window.app.models.ontologies.get(idOntology).get('name');

          //Get created/updated date
          var dateCreated = new Date();
          dateCreated.setTime(json.created);
          json.created = dateCreated.toLocaleDateString() + " " + dateCreated.toLocaleTimeString();
          var dateUpdated = new Date();
          dateUpdated.setTime(json.updated);
          json.updated = dateUpdated.toLocaleDateString() + " " + dateUpdated.toLocaleTimeString();

          self.resetElem("#projectInfoName",json.name);
          self.resetElem("#projectInfoOntology",json.ontologyName);
          self.resetElem("#projectInfoNumberOfSlides",json.numberOfSlides);
          self.resetElem("#projectInfoNumberOfImages",json.numberOfImages);
          self.resetElem("#projectInfoNumberOfAnnotations",json.numberOfAnnotations);
          self.resetElem("#projectInfoCreated",json.created);
          self.resetElem("#projectInfoUpdated",json.updated);

          $("#projectInfoUserList").empty();

          require(["text!application/templates/dashboard/UserInfo.tpl.html"], function(tpl) {
             //Get users list
             var users = []
             _.each(self.model.get('users'), function (idUser) {
                users.push(window.app.models.users.get(idUser).prettyName());
             });
             $("#projectInfoUserList").html(users.join(", "));
          });



       },
       fetchCommands : function (annotations) {
          var self = this;
          require([
             "text!application/templates/dashboard/CommandAnnotation.tpl.html",
             "text!application/templates/dashboard/CommandAnnotationTerm.tpl.html"],
              function(commandAnnotationTpl, commandAnnotationTermTpl) {
             var commandCollection = new CommandCollection({project:self.model.get('id'),max:self.maxCommandsView});

             var commandCallback = function(collection, response) {
                console.log("command.size()="+collection.length);
                $("#lastactionitem").empty();
                collection.each(function(command) {
                   var json = command.toJSON()

                   console.log("created="+json.created);
                   console.log(json);

                   var dateCreated = new Date();
                   dateCreated.setTime(json.created);
                   var dateStr = dateCreated.toLocaleDateString() + " " + dateCreated.toLocaleTimeString();

                   var jsonCommand = $.parseJSON(json.command.data);
                   console.log(jsonCommand); //jsonCommand.cropURL
                   console.log(jsonCommand.cropURL);
                   var action = ""

                   if(json.command.CLASSNAME=="be.cytomine.command.annotation.AddAnnotationCommand")
                   {
                      var cropStyle = "block";
                      var cropURL = jsonCommand.cropURL;

                      if (annotations.get(jsonCommand.id) == undefined) {
                         cropStyle = "none";
                         cropURL = "";
                      }

                      var action = _.template(commandAnnotationTpl, {idProject : self.model.id, idAnnotation : jsonCommand.id, idImage : jsonCommand.image,imageFilename : jsonCommand.imageFilename, icon:"add.png",text:json.prefixAction+ " " + json.command.action,datestr:dateStr,cropURL:cropURL, cropStyle:cropStyle});
                      $("#lastactionitem").append(action);
                   }
                   if(json.command.CLASSNAME=="be.cytomine.command.annotation.EditAnnotationCommand")
                   {
                      var cropStyle = "";
                      var cropURL = jsonCommand.newAnnotation.cropURL;
                      if (annotations.get(jsonCommand.newAnnotation.id) == undefined) {
                         cropStyle = "display : none;";
                         cropURL = "";
                      }

                      var action = _.template(commandAnnotationTpl, {idProject : self.model.id, idAnnotation : jsonCommand.newAnnotation.id, idImage : jsonCommand.newAnnotation.image,imageFilename : jsonCommand.newAnnotation.imageFilename,icon:"delete.gif",text:json.prefixAction+ " " +json.command.action,datestr:dateStr,cropURL:cropURL, cropStyle:cropStyle});
                      $("#lastactionitem").append(action);
                   }
                   if(json.command.CLASSNAME=="be.cytomine.command.annotation.DeleteAnnotationCommand")
                   {
                      var cropStyle = "";
                      var cropURL = jsonCommand.cropURL;
                      if (annotations.get(jsonCommand.id) == undefined) {
                         cropStyle = "display : none;";
                         cropURL = "";
                      }
                      var action = _.template(commandAnnotationTpl, {idProject : self.model.id, idAnnotation : jsonCommand.id, idImage : jsonCommand.image,imageFilename : jsonCommand.imageFilename,icon:"delete.gif",text:json.prefixAction+ " " +json.command.action,datestr:dateStr,cropURL:cropURL, cropStyle:cropStyle});
                      $("#lastactionitem").append(action);
                   }


                   if(json.command.CLASSNAME=="be.cytomine.command.annotationterm.AddAnnotationTermCommand")
                   {
                      console.log("json.command.CLASSNAME="+json.command.CLASSNAME);
                      var action = _.template(commandAnnotationTermTpl, {icon:"ui-icon-plus",text:json.prefixAction+ " " +json.command.action,datestr:dateStr,image:""});
                      $("#lastactionitem").append(action);

                   }
                   if(json.command.CLASSNAME=="be.cytomine.command.annotationterm.EditAnnotationTermCommand")
                   {
                      console.log("json.command.CLASSNAME="+json.command.CLASSNAME);
                      var action = _.template(commandAnnotationTermTpl, {icon:"ui-icon-pencil",text:json.prefixAction+ " " +json.command.action,datestr:dateStr,image:""});
                      $("#lastactionitem").append(action);

                   }
                   if(json.command.CLASSNAME=="be.cytomine.command.annotationterm.DeleteAnnotationTermCommand")
                   {
                      console.log("json.command.CLASSNAME="+json.command.CLASSNAME);
                      var action = _.template(commandAnnotationTermTpl, {icon:"ui-icon-trash",text:json.prefixAction+ " " +json.command.action,datestr:dateStr,image:""});
                      $("#lastactionitem").append(action);

                   }
                });
             }

             commandCollection.fetch({
                    success : function(model, response) {
                       commandCallback(model, response); //fonctionne mais très bourrin de tout refaire à chaque fois...
                    }
                 });
          });


       },
       resetElem : function(elem,txt) {
          console.log("find:"+$(this.el).find(elem).length);
          $(this.el).find(elem).empty();
          $(this.el).find(elem).append(txt);
       },
       doLayout : function(tpl) {
          console.log("ProjectDashboardView: printProjectInfo");

          var self = this;

          var html = _.template(tpl, self.model.toJSON());

          $(self.el).append(html);

          window.app.controllers.browse.tabs.addDashboard(self);

          self.initTabs();




       },
       initWidgets : function() {
          $( ".widgets" ).sortable({
                 connectWith: ".widgets"
              });

          /*$( ".widget" ).addClass( "ui-widget ui-widget-content ui-helper-clearfix ui-corner-all" )
           .find( ".widget-header" )
           .addClass( "ui-widget-header ui-corner-all" )
           .prepend( "<span class='ui-icon ui-icon-minusthick'></span>")
           .end()
           .find( ".widget-content" );

           $( ".widget-header .ui-icon" ).click(function() {
           $( this ).toggleClass( "ui-icon-minusthick" ).toggleClass( "ui-icon-plusthick" );
           $( this ).parents( ".widget:first" ).find( ".widget-content" ).toggle();
           });   */

          $( ".widgets" ).disableSelection();
       }
    });