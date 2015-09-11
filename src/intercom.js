(function () {
    angular.module('intercom', ['angularx', 'checkpoint', 'config'])
        .service('intercomRunner', ['$rootScope', '$window', '$location', '$timeout', 'resourceLoader', 'config', 'activeUserHasPermission', 'fetchAccountMetadata', IntercomRunner])
        .run(['intercomRunner', function (intercomRunner) {
            intercomRunner.run();
        }]);

    function IntercomRunner($rootScope, $window, $location, $timeout, resourceLoader, config, activeUserHasPermission, fetchAccountMetadata) {
        this.run = function () {
            if (!config.intercomAppId) return;
            var userIsPermitted;

            if (config.intercomAllowVisitors) {
                loadIntercomWidget();
            }
            else {
                activeUserHasPermission({
                    yes: loadIntercomWidget,
                    no: function () {
                        userIsPermitted = false;
                    },
                    scope: $rootScope
                }, 'edit.mode');
            }

            function loadIntercomWidget() {
                userIsPermitted = true;
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
                        if (userIsPermitted) bootIntercom(metadata);
                    },
                    unauthorized: function () {
                        shutdownIntercom();
                        if (config.intercomAllowVisitors) bootIntercomForVisitors();
                    },
                    scope: $rootScope
                });
            }

            function bootIntercom(metadata) {
                shutdownIntercom();
                $window.Intercom("boot", {
                    app_id: config.intercomAppId,
                    email: metadata.email,
                    user_id: metadata.email,
                    company: {
                        id: config.namespace,
                        name: config.namespace,
                        url: getCompanyUrl()
                    },
                    widget: {
                        activator: "#IntercomDefaultWidget"
                    }
                });
            }

            function bootIntercomForVisitors() {
                $window.Intercom("boot", {
                    app_id: config.intercomAppId
                });
            }

            function shutdownIntercom() {
                $window.Intercom("shutdown");
            }

            function getCompanyUrl() {
                return $location.protocol() + '://' + $location.host();
            }
        };
    }
})();