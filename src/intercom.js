(function () {
    angular.module('intercom', ['angularx', 'checkpoint', 'config'])
        .service('intercomRunner', ['$rootScope', '$window', '$timeout', 'resourceLoader', 'config', 'activeUserHasPermission', 'fetchAccountMetadata', IntercomRunner])
        .run(['intercomRunner', function (intercomRunner) {
            intercomRunner.run();
        }]);

    function IntercomRunner($rootScope, $window, $timeout, resourceLoader, config, activeUserHasPermission, fetchAccountMetadata) {
        this.run = function () {
            if(!config.intercomAppId) return;

            if (config.intercomAllowVisitors) {
                loadIntercomWidget();
            }
            else {
                activeUserHasPermission({
                    yes: loadIntercomWidget,
                    scope: $rootScope
                }, 'edit.mode');
            }

            function loadIntercomWidget() {
                resourceLoader.addScript('https://widget.intercom.io/widget/' + config.intercomAppId);

                function checkIfIntercomIsAvailable() {
                    if (typeof $window.Intercom != 'undefined') {
                        intercomIsAvailable();
                    } else {
                        $timeout(checkIfIntercomIsAvailable, 100);
                    }
                }
                checkIfIntercomIsAvailable();
            }

            function intercomIsAvailable() {
                fetchAccountMetadata({
                    ok: function (metadata) {
                        $window.Intercom("shutdown");
                        $window.Intercom("boot", {
                            app_id: config.intercomAppId,
                            email: metadata.email,
                            user_id: metadata.email,
                            widget: {
                                activator: "#IntercomDefaultWidget"
                            }
                        });
                    },
                    unauthorized: function () {
                        $window.Intercom("shutdown");
                        if (config.intercomAllowVisitors) {
                            $window.Intercom("boot", {
                                app_id: config.intercomAppId
                            });
                        }
                    },
                    scope: $rootScope
                });
            }
        };
    }
})();