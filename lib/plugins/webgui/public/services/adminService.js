const app = angular.module('app');

app.factory('adminApi', ['$http', '$q', 'moment', 'preload', ($http, $q, moment, preload) => {
  const getUser = (opt = {}) => {
    const search = opt.search || '';
    const filter = opt.filter || 'all';
    const sort = opt.sort || 'id';
    const page = opt.page || 1;
    const pageSize = opt.pageSize || 20;
    return $http.get('/api/admin/user', { params: opt }).then(success => success.data);
  };
  const getOrder = (opt = {}) => {
    const search = opt.search || '';
    const filter = opt.filter || '';
    const sort = opt.sort || 'alipay.createTime_desc';
    const page = opt.page || 1;
    const pageSize = opt.pageSize || 20;
    return $http.get('/api/admin/order', { params: opt }).then(success => success.data);
  };
  const getServer = () => {
    return $http.get('/api/admin/server').then(success => success.data);
  };

  let accountPromise = null;
  const getAccount = () => {
    if(accountPromise && !accountPromise.$$state.status) {
      return accountPromise;
    }
    accountPromise = $http.get('/api/admin/account').then(success => success.data);
    return accountPromise;
  };

  const getServerFlow = serverId => {
    return $q.all([
      $http.get('/api/admin/flow/' + serverId, {
        params: {
          time: [
            moment().hour(0).minute(0).second(0).millisecond(0).toDate().valueOf(),
            moment().toDate().valueOf(),
          ],
        }
      }),
      $http.get('/api/admin/flow/' + serverId, {
        params: {
          time: [
            moment().day(0).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf(),
            moment().toDate().valueOf(),
          ],
        }
      }),
      $http.get('/api/admin/flow/' + serverId, {
        params: {
          time: [
            moment().date(1).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf(),
            moment().toDate().valueOf(),
          ],
        }
      }),
    ]).then(success => {
      return {
        today: success[0].data[0],
        week: success[1].data[0],
        month: success[2].data[0],
      };
    });
  };

  let serverFlowLastHourPromise = {};
  const getServerFlowLastHour = serverId => {
    if(serverFlowLastHourPromise[serverId] && !serverFlowLastHourPromise[serverId].$$state.status) {
      return serverFlowLastHourPromise[serverId];
    }
    serverFlowLastHourPromise[serverId] = $http.get('/api/admin/flow/' + serverId + '/lastHour').then(success => {
      return {
        time: success.data.time,
        flow: success.data.flow,
      };
    });
    return serverFlowLastHourPromise[serverId];
  };

  const getAccountId = port => {
    return $http.get('/api/admin/account/port/' + port).then(success => success.data.id);
  };

  let indexInfoPromise = null;
  const getIndexInfo = () => {
    if(indexInfoPromise && !indexInfoPromise.$$state.status) {
      return indexInfoPromise;
    }
    indexInfoPromise = $q.all([
      $http.get('/api/admin/user/recentSignUp').then(success => success.data),
      $http.get('/api/admin/user/recentLogin').then(success => success.data),
    ]).then(success => {
      return {
        signup: success[0],
        login: success[1],
      };
    });
    return indexInfoPromise;
  };

  const getServerPortData = (serverId, port) => {
    const Promises = [
      $http.get(`/api/admin/flow/${ serverId }/${ port }/lastConnect`),
      $http.get(`/api/admin/flow/${ serverId }/${ port }`),
    ];
    return $q.all(Promises).then(success => {
      return {
        lastConnect: success[0].data.lastConnect,
        flow: success[1].data[0],
      };
    });
  };

  const getUserData = (userId) => {
    return $q.all([
      $http.get('/api/admin/user/' + userId),
      $http.get('/api/admin/user/account'),
      $http.get('/api/admin/order/' + userId),
    ]).then(success => {
      return {
        user: success[0].data,
        account: success[1].data,
        orders: success[2].data,
      };
    });
  };
  
  const getChartData = (serverId, type, time, doNotPreload) => {
    let queryTime;
    if(type === 'hour') {
      !doNotPreload && getChartData(serverId, type, time - 3600000, true);
      !doNotPreload && getChartData(serverId, type, time - 2 * 3600000, true);
      !doNotPreload && getChartData(serverId, type, time - 3 * 3600000, true);
      queryTime = moment(time).minute(0).second(0).millisecond(0).toDate().getTime();
    }
    if(type === 'day') {
      !doNotPreload && getChartData(serverId, type, time - 24 * 3600000, true);
      !doNotPreload && getChartData(serverId, type, time - 2 * 24 * 3600000, true);
      !doNotPreload && getChartData(serverId, type, time - 3 * 24 * 3600000, true);
      queryTime = moment(time).hour(0).minute(0).second(0).millisecond(0).toDate().getTime();
    }
    if(type === 'week') {
      !doNotPreload && getChartData(serverId, type, time - 7 * 24 * 3600000, true);
      !doNotPreload && getChartData(serverId, type, time - 2 * 7 * 24 * 3600000, true);
      !doNotPreload && getChartData(serverId, type, time - 3 * 7 * 24 * 3600000, true);
      queryTime = moment(time).day(0).hour(0).minute(0).second(0).millisecond(0).toDate().getTime();
    }
    const id = `getChartData:${ serverId }:${ type }:${ queryTime }`;
    const promise = () => {
      return $q.all([
        $http.get('/api/admin/flow/' + serverId, {
          params: {
            type,
            time: new Date(queryTime),
          }
        }),
        $http.get('/api/admin/flow/' + serverId + '/user', {
          params: {
            type,
            time: new Date(queryTime),
          }
        }),
      ]);
    };
    return preload.get(id, promise, 90 * 1000);
  };

  const getAccountChartData = (serverId, accountId, port, type, time, doNotPreload) => {
    let queryTime;
    if(type === 'hour') {
      !doNotPreload && getAccountChartData(serverId, accountId, port, type, time - 3600000, true);
      !doNotPreload && getAccountChartData(serverId, accountId, port, type, time - 2 * 3600000, true);
      !doNotPreload && getAccountChartData(serverId, accountId, port, type, time - 3 * 3600000, true);
      queryTime = moment(time).minute(0).second(0).millisecond(0).toDate().getTime();
    }
    if(type === 'day') {
      !doNotPreload && getAccountChartData(serverId, accountId, port, type, time - 24 * 3600000, true);
      !doNotPreload && getAccountChartData(serverId, accountId, port, type, time - 2 * 24 * 3600000, true);
      !doNotPreload && getAccountChartData(serverId, accountId, port, type, time - 3 * 24 * 3600000, true);
      queryTime = moment(time).hour(0).minute(0).second(0).millisecond(0).toDate().getTime();
    }
    if(type === 'week') {
      !doNotPreload && getAccountChartData(serverId, accountId, port, type, time - 7 * 24 * 3600000, true);
      !doNotPreload && getAccountChartData(serverId, accountId, port, type, time - 2 * 7 * 24 * 3600000, true);
      !doNotPreload && getAccountChartData(serverId, accountId, port, type, time - 3 * 7 * 24 * 3600000, true);
      queryTime = moment(time).day(0).hour(0).minute(0).second(0).millisecond(0).toDate().getTime();
    }
    const id = `getAccountChartData:${ serverId }:${ accountId }:${ port }:${ type }:${ queryTime }`;
    const promise = () => {
      return $q.all([
        $http.get(`/api/admin/flow/${ serverId }`, {
          params: {
            port,
            type,
            time: new Date(time),
          }
        }),
        $http.get(`/api/admin/flow/account/${ accountId }`, {
          params: {
            port,
            type,
            time: new Date(time),
          }
        })
      ]);
    };
    return preload.get(id, promise, 90 * 1000);
  };

  return {
    getUser,
    getOrder,
    getServer,
    getAccount,
    getServerFlow,
    getServerFlowLastHour,
    getAccountId,
    getIndexInfo,
    getServerPortData,
    getUserData,
    getChartData,
    getAccountChartData,
  };
}]);
