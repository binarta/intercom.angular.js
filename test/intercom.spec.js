describe('intercom', function () {
    beforeEach(module('intercom'));

    var config, resourceLoader, intercomRunner, $timeout, $window, intercom, fetchAccountMetadata, activeUserHasPermission;

    beforeEach(inject(function (_config_, _resourceLoader_, _intercomRunner_, _$timeout_, _$window_, _fetchAccountMetadata_, _activeUserHasPermission_) {
        config = _config_;
        resourceLoader = _resourceLoader_;
        intercomRunner = _intercomRunner_;
        $timeout = _$timeout_;
        $window = _$window_;
        fetchAccountMetadata = _fetchAccountMetadata_;
        activeUserHasPermission = _activeUserHasPermission_;

        config.namespace = 'namespace';

        intercom = jasmine.createSpy('Intercom');
    }));

    it('when no app id is defined, do nothing', function () {
        intercomRunner.run();

        expect(activeUserHasPermission).not.toHaveBeenCalled();
    });

    it('when app id is empty, do nothing', function () {
        config.intercomAppId = '';

        intercomRunner.run();

        expect(activeUserHasPermission).not.toHaveBeenCalled();
    });

    describe('with app id', function () {
        beforeEach(function () {
            config.intercomAppId = 'appId';
        });

        describe('allow visitors to use intercom', function () {
            beforeEach(function () {
                config.intercomAllowVisitors = true;

                intercomRunner.run();
            });

            it('script is injected', function () {
                expect(resourceLoader.addScript).toHaveBeenCalledWith('https://widget.intercom.io/widget/' + config.intercomAppId);
            });

            describe('when Intercom is loaded', function () {
                beforeEach(function () {
                    $timeout(function () {
                        $window.Intercom = intercom;
                    });
                    $timeout.flush();
                });

                describe('and user is unauthorized', function () {
                    beforeEach(function () {
                        fetchAccountMetadata.calls[0].args[0].unauthorized();
                    });

                    it('boot Intercom', function () {
                        expect(intercom).toHaveBeenCalledWith('shutdown');
                        expect(intercom).toHaveBeenCalledWith('boot', {
                            app_id: config.intercomAppId
                        });
                    });
                });

                describe('and user is authorized', function () {
                    var metadata = {
                        email: 'email'
                    };

                    beforeEach(function () {
                        fetchAccountMetadata.calls[0].args[0].ok(metadata);
                    });

                    it('boot Intercom with user', function () {
                        expect(intercom).toHaveBeenCalledWith('shutdown');
                        expect(intercom).toHaveBeenCalledWith('boot', {
                            app_id: config.intercomAppId,
                            email: metadata.email,
                            user_id: metadata.email,
                            company: {
                                id: config.namespace,
                                name: config.namespace,
                                url: 'http://server'
                            },
                            widget: {
                                activator: "#IntercomDefaultWidget"
                            }
                        });
                    });
                });
            });
        });

        describe('do not allow visitors to use Intercom', function () {
            beforeEach(function () {
                intercomRunner.run();
            });

            it('active user needs edit.mode permission', function () {
                expect(activeUserHasPermission.calls[0].args[1]).toEqual('edit.mode');
            });

            describe('and active user has permission', function () {
                beforeEach(function () {
                    activeUserHasPermission.calls[0].args[0].yes();
                });

                it('script is injected', function () {
                    expect(resourceLoader.addScript).toHaveBeenCalledWith('https://widget.intercom.io/widget/' + config.intercomAppId);
                });

                describe('when Intercom is loaded', function () {
                    beforeEach(function () {
                        $timeout(function () {
                            $window.Intercom = intercom;
                        });
                        $timeout.flush();
                    });

                    describe('and user is unauthorized', function () {
                        beforeEach(function () {
                            fetchAccountMetadata.calls[0].args[0].unauthorized();
                        });

                        it('Intercom is shut down', function () {
                            expect(intercom).toHaveBeenCalledWith('shutdown');
                            expect(intercom).not.toHaveBeenCalledWith('boot');
                        });
                    });

                    describe('and user is authorized', function () {
                        var metadata = {
                            email: 'email'
                        };

                        beforeEach(function () {
                            fetchAccountMetadata.calls[0].args[0].ok(metadata);
                        });

                        it('boot Intercom with user', function () {
                            expect(intercom).toHaveBeenCalledWith('shutdown');
                            expect(intercom).toHaveBeenCalledWith('boot', {
                                app_id: config.intercomAppId,
                                email: metadata.email,
                                user_id: metadata.email,
                                company: {
                                    id: config.namespace,
                                    name: config.namespace,
                                    url: 'http://server'
                                },
                                widget: {
                                    activator: "#IntercomDefaultWidget"
                                }
                            });
                        });
                    });

                    describe('and somehow user loses permission (e.g. clerk logs out and logs in with other user in same session)', function () {
                        beforeEach(function () {
                            activeUserHasPermission.calls[0].args[0].no();
                            fetchAccountMetadata.calls[0].args[0].ok();
                        });

                        it('Intercom is not booted', function () {
                            expect(intercom).not.toHaveBeenCalledWith('boot');
                        });
                    });
                });
            });
        });
    });
});