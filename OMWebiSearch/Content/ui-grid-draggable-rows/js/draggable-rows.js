(function () {
    'use strict';

    angular.module('ui.grid.draggable-rows', ['ui.grid'])

    .constant('uiGridDraggableRowsConstants', {
        featureName: 'draggableRows',
        ROW_OVER_CLASS: 'ui-grid-draggable-row-over',
        ROW_OVER_ABOVE_CLASS: 'ui-grid-draggable-row-over--above',
        ROW_OVER_BELOW_CLASS: 'ui-grid-draggable-row-over--below',
        POSITION_ABOVE: 'above',
        POSITION_BELOW: 'below',
        publicEvents: {
            draggableRows: {
                rowDragged: function (scope, info, rowElement) { },
                rowDropped: function (scope, info, targetElement) { },
                rowOverRow: function (scope, info, rowElement) { },
                rowEnterRow: function (scope, info, rowElement) { },
                rowLeavesRow: function (scope, info, rowElement) { },
                rowFinishDrag: function (scope) { }
            }
        }
    })

    .factory('uiGridDraggableRowsCommon', [function () {
        return {
            draggedRow: null,
            draggedRowEntity: null,
            position: null,
            fromIndex: null,
            toIndex: null,
            e: null,
            setDropEffect: null,
            removeDropEffect: null
        };
    }])

    .service('uiGridDraggableRowsService', ['uiGridDraggableRowsConstants', function (uiGridDraggableRowsConstants) {

        this.noDrop = false;

        this.initializeGrid = function (grid, $scope, $element, noDrop) {

            this.noDrop = noDrop;

            grid.api.registerEventsFromObject(uiGridDraggableRowsConstants.publicEvents);

            if (noDrop) {
                return;
            }

            grid.api.draggableRows.on.rowFinishDrag($scope, function () {
                angular.forEach($element[0].querySelectorAll('.' + uiGridDraggableRowsConstants.ROW_OVER_CLASS), function (row) {
                    row.classList.remove(uiGridDraggableRowsConstants.ROW_OVER_CLASS);
                    row.classList.remove(uiGridDraggableRowsConstants.ROW_OVER_ABOVE_CLASS);
                    row.classList.remove(uiGridDraggableRowsConstants.ROW_OVER_BELOW_CLASS);
                });
            });
        };
    }])

    .service('uiGridDraggableRowService', ['uiGridDraggableRowsConstants', 'uiGridDraggableRowsCommon', 'uiGridDraggableRowsService', '$parse', function (uiGridDraggableRowsConstants, uiGridDraggableRowsCommon, uiGridDraggableRowsService, $parse) {
        var move = function (from, to) {
            /*jshint validthis: true */
            this.splice(to, 0, this.splice(from, 1)[0]);
        };

        var _dropEffect = '';

        this.prepareDraggableRow = function ($scope, $element) {
            var grid = $scope.grid;
            var row = $element[0];

            var data = function () {
                if (angular.isString(grid.options.data)) {
                    return $parse(grid.options.data)(grid.appScope);
                }

                return grid.options.data;
            };

            var listeners = {
                onDragOverEventListener: function (e) {

                    if (e.preventDefault) {
                        e.preventDefault();
                    }

                    var dataTransfer = e.dataTransfer || e.originalEvent.dataTransfer;

                    if (uiGridDraggableRowsService.noDrop || _dropEffect === 'none') {
                        dataTransfer.dropEffect = 'none';
                        return;
                    }

                    dataTransfer.effectAllowed = 'copyMove';
                    if (_dropEffect) {
                        dataTransfer.dropEffect = _dropEffect;
                    }
                    else {
                        if (e.ctrlKey) {
                            dataTransfer.dropEffect = 'copy';
                        }
                        else {
                            dataTransfer.dropEffect = 'move';
                        }
                    }

                    var offset = e.offsetY || e.layerY || (e.originalEvent ? e.originalEvent.offsetY : 0);

                    $element.addClass(uiGridDraggableRowsConstants.ROW_OVER_CLASS);

                    if (offset < this.offsetHeight / 2) {
                        uiGridDraggableRowsCommon.position = uiGridDraggableRowsConstants.POSITION_ABOVE;

                        $element.removeClass(uiGridDraggableRowsConstants.ROW_OVER_BELOW_CLASS);
                        $element.addClass(uiGridDraggableRowsConstants.ROW_OVER_ABOVE_CLASS);

                    } else {
                        uiGridDraggableRowsCommon.position = uiGridDraggableRowsConstants.POSITION_BELOW;

                        $element.removeClass(uiGridDraggableRowsConstants.ROW_OVER_ABOVE_CLASS);
                        $element.addClass(uiGridDraggableRowsConstants.ROW_OVER_BELOW_CLASS);
                    }

                    uiGridDraggableRowsCommon.e = e;

                    grid.api.draggableRows.raise.rowOverRow(uiGridDraggableRowsCommon, this);
                },

                onDragStartEventListener: function (e) {
                    //this.style.opacity = '0.5';
                    //e.dataTransfer.setData("text/plain", JSON.stringify($scope.$parent.$parent.row.entity))
                    //e.dataTransfer.setData('row', $scope.$parent.$parent.row.entity); // Need to set some data for FF to work		
                    console.log(e);
                    uiGridDraggableRowsCommon.e = e;
                    uiGridDraggableRowsCommon.draggedRow = this;
                    uiGridDraggableRowsCommon.draggedRowEntity = $scope.$parent.$parent.row.entity;
                    uiGridDraggableRowsCommon.setDropEffect = function (dropEffect) {
                        console.log("setDropEffect " + dropEffect);
                        _dropEffect = dropEffect;
                    };
                    uiGridDraggableRowsCommon.removeDropEffect = function () {
                        console.log("removeDropEffect");
                        _dropEffect = '';
                    };

                    uiGridDraggableRowsCommon.position = null;

                    uiGridDraggableRowsCommon.fromIndex = data().indexOf(uiGridDraggableRowsCommon.draggedRowEntity);
                    uiGridDraggableRowsCommon.toIndex = null;

                    grid.api.draggableRows.raise.rowDragged(uiGridDraggableRowsCommon, this);
                },

                onDragLeaveEventListener: function () {
                    this.style.opacity = '1';

                    this.classList.remove(uiGridDraggableRowsConstants.ROW_OVER_CLASS);
                    this.classList.remove(uiGridDraggableRowsConstants.ROW_OVER_ABOVE_CLASS);
                    this.classList.remove(uiGridDraggableRowsConstants.ROW_OVER_BELOW_CLASS);

                    grid.api.draggableRows.raise.rowLeavesRow(uiGridDraggableRowsCommon, this);

                },

                onDragEnterEventListener: function () {
                    grid.api.draggableRows.raise.rowEnterRow(uiGridDraggableRowsCommon, this);
                },

                onDragEndEventListener: function () {
                    grid.api.draggableRows.raise.rowFinishDrag();
                },

                onDropEventListener: function (e) {
                    var draggedRow = uiGridDraggableRowsCommon.draggedRow;

                    if (e.stopPropagation) {
                        e.stopPropagation();
                    }

                    if (e.preventDefault) {
                        e.preventDefault();
                    }

                    if (draggedRow === this) {
                        return false;
                    }

                    // in case of an extra row a new row will be added in the last position
                    uiGridDraggableRowsCommon.toIndex = $scope.$parent.$parent.row ? data().indexOf($scope.$parent.$parent.row.entity) : data().length;

                    if (uiGridDraggableRowsCommon.position === uiGridDraggableRowsConstants.POSITION_ABOVE) {
                        if (uiGridDraggableRowsCommon.fromIndex < uiGridDraggableRowsCommon.toIndex) {
                            uiGridDraggableRowsCommon.toIndex -= 1;
                        }

                    } else if (uiGridDraggableRowsCommon.fromIndex >= uiGridDraggableRowsCommon.toIndex) {
                        uiGridDraggableRowsCommon.toIndex += 1;
                    }

                    //$scope.$apply(function () {
                    //    move.apply(data(), [uiGridDraggableRowsCommon.fromIndex, uiGridDraggableRowsCommon.toIndex]);
                    //});

                    //On drag start and drop dropEffect is by default none 
                    //Because of that we need to set correct value again
                    //https://developer.mozilla.org/en-US/docs/Web/Events/dragover 
                    //General Info -> Default Action -> Reset the current drag operation to "none".
                    var dataTransfer = e.dataTransfer || e.originalEvent.dataTransfer;
                    if (_dropEffect) {
                        dataTransfer.dropEffect = _dropEffect;
                    }
                    else {
                        if (e.ctrlKey) {
                            dataTransfer.dropEffect = 'copy';
                        }
                        else {
                            dataTransfer.dropEffect = 'move';
                        }
                    }

                    uiGridDraggableRowsCommon.e = e;

                    this.style.opacity = '1';
                    this.classList.remove(uiGridDraggableRowsConstants.ROW_OVER_CLASS);
                    this.classList.remove(uiGridDraggableRowsConstants.ROW_OVER_ABOVE_CLASS);
                    this.classList.remove(uiGridDraggableRowsConstants.ROW_OVER_BELOW_CLASS);

                    grid.api.draggableRows.raise.rowDropped(uiGridDraggableRowsCommon, this);

                    e.preventDefault();
                }
            };

            row.addEventListener('dragover', listeners.onDragOverEventListener, false);
            row.addEventListener('dragstart', listeners.onDragStartEventListener, false);
            row.addEventListener('dragleave', listeners.onDragLeaveEventListener, false);
            row.addEventListener('dragenter', listeners.onDragEnterEventListener, false);
            row.addEventListener('dragend', listeners.onDragEndEventListener, false);
            row.addEventListener('drop', listeners.onDropEventListener);
        };
    }])

    .directive('uiGridDraggableRow', ['uiGridDraggableRowService', function (uiGridDraggableRowService) {
        return {
            restrict: 'ACE',
            scope: {
                grid: '='
            },
            compile: function () {
                return {
                    pre: function ($scope, $element) {
                        uiGridDraggableRowService.prepareDraggableRow($scope, $element);
                    }
                };
            }
        };
    }])

    .directive('uiGridDraggableRows', ['uiGridDraggableRowsService', function (uiGridDraggableRowsService) {
        return {
            restrict: 'A',
            replace: true,
            priority: 0,
            require: 'uiGrid',
            scope: false,
            compile: function () {
                return {
                    pre: function ($scope, $element, $attrs, uiGridCtrl) {
                        var noDrop = !!$attrs.omwUiGridNoDrop;
                        uiGridDraggableRowsService.initializeGrid(uiGridCtrl.grid, $scope, $element, noDrop);
                    }
                };
            }
        };
    }])

    // ui-grid-draggable-extra-row attribute creates fake row in grid to DnD into the white space
    .constant('uiGridExtraRowElement', angular.element(
        '<div grid="gridApi.grid">' +
            '<div role="row">' +
                '<div grid="gridApi.grid" class="ui-grid-draggable-row extra-row-element">' +
                '</div>' +
            '</div>' +
        '</div>'))
    .directive('gridDraggableExtraRow', ['uiGridExtraRowElement', '$compile', function (uiGridExtraRowElement, $compile) {
        return {
            link: function (scope, element) {
                let row = $compile(uiGridExtraRowElement)(scope);
                scope.$watch('gridOptions.data', _.debounce(function (n, o) {
                    if (n) {
                        row.remove() // remove if created previously to append in again as a last row
                        let viewport = element.find(".ui-grid-viewport")
                        let canvas = element.find(".ui-grid-canvas")
                        let height = Math.max($(viewport).height() - $(canvas).height(), 30);
                        canvas.append(row);
                        let extraRow = element.find(".extra-row-element")
                        $(extraRow).height(height)
                    }
                }, 250), true);
            }
        };
    }]);
}());