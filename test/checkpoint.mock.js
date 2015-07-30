angular.module('checkpoint', [])
    .service('activeUserHasPermission', function() {
        return jasmine.createSpy('activeUserHasPermission');
    })
    .service('fetchAccountMetadata', function () {
        return jasmine.createSpy('fetchAccountMetadata');
    });