module.exports = {
  // https://vuepress.vuejs.org/zh/guide/deploy.html#github-pages
  base: '/blog/',
  title: 'Stan Xing 的个人博客',
  description: '记录自己的技术成长',
  lastUpdated: '上次更新',
  dest: '.vuepress/public',
  themeConfig: {
    lastUpdated: '上次更新',
    sidebar: [
      '',
      {
        title: 'Algorithms',
        children: [
          'algorithms/',
        ],
      },{
        title: 'Linux',
        children: [
          {
            title: 'Kernel',
            children: [
              'linux/kernel/tcp.md',
              'linux/kernel/tcpdump.md',
            ],
          },
          {
            title: 'Ubuntu',
            children: [
              'linux/ubuntu/postinstall',
            ],
          },{
            title: 'Systemd',
            children: [
              'linux/systemd/journald',
            ],
          },{
            title: 'Shell',
            children: [
              'linux/shell/coding_style',
              'linux/shell/grammer',
              'linux/shell/command',
              'linux/shell/zsh_vs_bash',
            ],
          },
        ],
      },{
        title: 'HTTP',
        children: [
          'http/http_cache',
          'http/https',
          'http/http_basic',
        ],
      },{
        title: 'Golang',
        children: [
          'golang/effective_go',
          'golang/flag_pkg_source_code',
          'golang/context_pkg_source_code',
          'golang/reflect_pkg_source_code_1',
          'golang/map_type_1',
        ],
      },{
        title: 'NodeJS',
        children: [
          'nodejs/promise',
          'nodejs/set_interval_no_overlap'
        ],
      },{
        title: 'Database',
        children: [
          {
            title: 'MongoDB',
            children: [
              'database/mongodb/model_design',
              'database/mongodb/mongodb_crud_1',
              'database/mongodb/mongodb_crud_2',
              'database/mongodb/mongodb_index_1',
              'database/mongodb/mongodb_index_2',
              'database/mongodb/mongodb_replica_set',
              'database/mongodb/mongodb_problem_1',
            ],
          }, {
            title: 'MySQL',
            children: [
              'database/mysql/model_design',
              'database/mysql/transaction',
            ],
          },
        ],
      }, {
        title: 'Infrastructure',
        children: [
          {
            title: 'K8S',
            children: [
              'infrastructure/k8s/kubeadm',
            ],
          }, {
            title: 'Log',
            children: [
              'infrastructure/log/journalbeat/journalbeat',
            ],
          }, {
            title: 'Logstash',
            children: [
              'infrastructure/log/logstash/tune_performance',
            ],
          }, {
            title: 'Monitor',
            children: [
              {
                title: 'Influxdata',
                children: [
                  'infrastructure/monitor/influxdata/telegraf',
                  'infrastructure/monitor/influxdata/tick',
                  'infrastructure/monitor/influxdata/batch_vs_stream',
                  'infrastructure/monitor/influxdata/down_sampling',
                ],
              },
              // 'infrastructure/monitor/pull_vs_push',
            ],
          },
        ],
      }, {
        title: 'SRE',
        children: [
          'sre/sre',
        ],
      },
    ],
  },
  markdown: {
    lineNumbers: true,
    plugins: [
      'markdown-it-footnote',
      'markdown-it-attrs'
    ],
    extendMarkdown: (md) => {
      md.set({
        breaks: true,
        linkify: true,
      });
    },
  },
  evergreen: true,
};
