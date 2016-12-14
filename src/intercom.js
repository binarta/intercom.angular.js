(function () {
    angular.module('intercom', ['angularx', 'config', 'binarta-checkpointjs-angular1'])
        .factory('intercom', ['$window', '$location', 'resourceLoader', 'config', 'binarta', IntercomFactory])
        .run(['intercom', function (intercom) {intercom()}]);

    function IntercomFactory($window, $location, resourceLoader, config, binarta) {
        return function () {
            if (!config.intercomAppId) return;

            binarta.checkpoint.profile.eventRegistry.observe({
                signedin: onSignedIn,
                signedout: onSignedOut
            });

            function onSignedIn() {
                shutdownIntercom();
                if (isAllowedForVisitors() || isPermitted()) loadIntercomWidget();
            }

            function onSignedOut() {
                shutdownIntercom();
                if (isAllowedForVisitors()) loadIntercomWidget();
            }

            if (isAllowedForVisitors() || isPermitted()) loadIntercomWidget();


            function loadIntercomWidget() {
                resourceLoader.getScript('https://widget.intercom.io/widget/' + config.intercomAppId).then(function () {
                    binarta.checkpoint.profile.authenticated ? bootIntercom() : bootIntercomForVisitors();
                });
            }

            function isPermitted() {
                return binarta.checkpoint.profile.hasPermission('edit.mode');
            }

            function isAllowedForVisitors() {
                return config.intercomAllowVisitors;
            }

            function bootIntercom() {
                var metadata = binarta.checkpoint.profile.metadata();
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
                if ($window.Intercom) $window.Intercom("shutdown");
            }

            function getCompanyUrl() {
                return $location.protocol() + '://' + $location.host();
            }
        };
    }
})();