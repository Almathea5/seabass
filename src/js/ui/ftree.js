define([
    "inspire",
    "app/settings",
    "app/app-event",
    "co"
], function(InspireTree, settings, AppEvent, co) {
    "use strict";

    class FileTree {
        constructor(rootElemSelector, fileManager) {
            if (!rootElemSelector) {
                throw new Error("RootElem selector for the tree is missing");
            }
            if (!fileManager) {
                throw new Error("FileManager instance for the tree is missing");
            }
            let self = this;

            this._rootSelector = rootElemSelector;
            this.fileManager = fileManager;
            if (this.fileManager.isLoaded()) {
                this._init();
            } else {
                AppEvent.on('fsready', function() {
                    self._init();
                });
            }
        }

        closeMobile() {
            location.hash = "";
        }

        _init() {
            this.tree = this._render();
            this.tree.on('node.click', function(event, node) {
                AppEvent.dispatch('tree__node-click', {
                    node: node
                });
            });
        }

        _render(rootElemSelector) {
            this._getData().then(function(fileInfo) {
                if (fileInfo.length) {
                    AppEvent.dispatch('tree__update__has-data');
                }
            });

            return new InspireTree({
                'target': this._rootSelector,
                'data': this._getData.bind(this),
                'selection': {
                    'allow': function() {
                        return false;
                    }
                },
                contextMenu: this._getContextMenu()
            });
        }

        _getData(node) {
            var self = this;
            return co(function*() {
                var navEnabled = yield settings.get('navEnabled');
                // console.log(navEnabled);
                var data = yield self.fileManager.getFiles(node ? node.entry : null, navEnabled);
                var d = data.sort(function(a, b) {
                    if (a.children && !b.children) {
                        return -1;
                    }

                    if (!a.children && b.children) {
                        return 1;
                    }
                    return (a.text < b.text ? -1 : (a.text > b.text ? 1 : 0));
                });
                return d;
            });
        }

        _getContextMenu() {
            return [{
                text: 'Create file...',
                handler: function(event, node, closer) {
                    AppEvent.dispatch('tree__node-create', {
                        node: node
                    });
                    closer(node);
                }
            }, {
                text: 'Rename/move...',
                handler: function(event, node, closer) {
                    AppEvent.dispatch('tree__node-rename', {
                        node: node
                    });
                    closer(node);
                }

            }, {
                text: 'Delete',
                handler: function(event, node, closer) {
                    AppEvent.dispatch('tree__node-delete', {
                        node: node
                    });
                    closer(node);
                }
            }];
        }
    }

    return FileTree;
});