Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function(){
        var millisecondsInDay = 86400000;
        var currentDate = new Date();
        var startDate = new Date(currentDate - millisecondsInDay*30); //in the last 30 days
        var startDateUTC = startDate.toISOString();
        Ext.create('Rally.data.wsapi.Store', {
            model: 'User Story',
            fetch: ['FormattedID','Name', 'Owner', 'ScheduleState','Children','Project'],
            autoLoad: true,
            filters: [
                {
                    property: 'DirectChildrenCount',
                    operator: '>',
                    value: 0
                },
                {
                    property: 'LastUpdateDate',
                    operator: '>',
                    value: startDateUTC
                }
            ],
            listeners: {
                load: this._onDataLoaded,
                scope: this
            }
        }); 
    },
    _onDataLoaded: function(store, data){
        var stories = [];
        var pendingchildren = data.length;
        _.each(data, function(story) {
            var s  = {
                FormattedID: story.get('FormattedID'),
                Name: story.get('Name'),
                Owner:  (story.get('Owner') && story.get('Owner')._refObjectName) || 'None',
                ScheduleState: story.get('ScheduleState'),
                Project: story.get('Project')._refObjectName,
                _ref: story.get("_ref"),
                Children: []
            };
                    
                var children = story.getCollection('Children', {fetch: ['FormattedID','Owner','ScheduleState','Project']});
                   children.load({
                        callback: function(records, operation, success){
                            _.each(records, function(child){
                                        s.Children.push({
                                        _ref: child.get('_ref'),
                                        FormattedID: child.get('FormattedID'),
                                        ScheduleState: child.get('ScheduleState'),
                                        Owner:  (child.get('Owner') && child.get('Owner')._refObjectName) || 'None',
                                        Project: child.get('Project')._refObjectName,
                                    });
                            }, this);
                            
                            --pendingchildren;
                            if (pendingchildren === 0) {
                                this._createGrid(stories);
                            }
                        },
                        scope: this
                    });
                    stories.push(s);
        }, this);
    },
    
    _createGrid: function(stories) {
        console.log(stories);
        var store = Ext.create('Rally.data.custom.Store', {
                data: stories,
                pageSize: 100,
                remoteSort:false
            });
         this.add({
            xtype: 'rallygrid',
            itemId: 'sgrid',
            store: store,
            columnCfgs: [
                {
                   text: 'Formatted ID', dataIndex: 'FormattedID', xtype: 'templatecolumn',
                    tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')
                },
                {
                    text: 'Name', dataIndex: 'Name'
                },
                {
                    text: 'Owner', dataIndex: 'Owner'
                },
                {
                    text: 'Project', dataIndex: 'Project'
                },
                {
                    text: 'ScheduleState', dataIndex: 'ScheduleState', xtype: 'templatecolumn',
                        tpl: Ext.create('Rally.ui.renderer.template.ScheduleStateTemplate',
                            {
                                states: ['Defined', 'In-Progress', 'Completed', 'Accepted'],
                                field: {
                                    name: 'ScheduleState' 
                                }
                        })
                },
                {
                    text: 'Child Stories', dataIndex: 'Children', minWidth:200,
                    renderer: function(value) {
                        var html = [];
                        _.each(value, function(child){
                            html.push('<a href="' + Rally.nav.Manager.getDetailUrl(child) + '">' + child.FormattedID + '</a>' + ' ScheduleState: ' + child.ScheduleState);
                        });
                        return html.join('</br>');
                    }
                },
                {
                    text: 'Chil Story Owner', dataIndex: 'Children', 
                    renderer: function(value) {
                        var html = [];
                        _.each(value, function(child){
                            html.push(child.Owner);
                        });
                        return html.join('</br>');
                    }
                },
                {
                    text: 'Chil Story Project', dataIndex: 'Children', minWidth:200,
                    renderer: function(value) {
                        var html = [];
                        _.each(value, function(child){
                            html.push(child.Project);
                        });
                        return html.join('</br>');
                    }
                }
            ]
            
        });
    }
       
});
