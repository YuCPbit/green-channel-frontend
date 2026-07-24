// src/router/workstudy.js
const workstudyRoutes = [
    {
        path: '/workstudy',
        name: 'WorkStudy',
        component: () => import('@/views/workstudy/Dashboard.vue'),
        meta: { title: '勤工俭学', requiresAuth: true, module: 'workstudy' },
        redirect: '/workstudy/dashboard',
        children: [
            /* ================== 工作台 ================== */
            {
                path: 'dashboard',
                name: 'WorkStudyDashboard',
                component: () => import('@/views/workstudy/Dashboard.vue'),
                meta: { title: '工作台' }
            },

            /* ================== 岗位管理 ================== */
            {
                path: 'positions',
                name: 'PositionList',
                component: () => import('@/views/workstudy/positions/PositionList.vue'),
                meta: { title: '岗位管理' }
            },
            {
                path: 'positions/publish',
                name: 'PositionPublish',
                component: () => import('@/views/workstudy/positions/PositionPublish.vue'),
                meta: { title: '发布岗位' }
            },
            {
                path: 'positions/:id',
                name: 'PositionDetail',
                component: () => import('@/views/workstudy/positions/PositionDetail.vue'),
                meta: { title: '岗位详情' }
            },
            {
                path: 'positions/:id/approve',
                name: 'PositionApprove',
                component: () => import('@/views/workstudy/positions/PositionApprove.vue'),
                meta: { title: '岗位审核' }
            },

            /* ================== 申请管理 ================== */
            {
                path: 'apply',
                name: 'ApplyList',
                component: () => import('@/views/workstudy/apply/ApplyList.vue'),
                meta: { title: '申请管理' }
            },
            {
                path: 'apply/my',
                name: 'MyApplications',
                component: () => import('@/views/workstudy/apply/MyApplications.vue'),
                meta: { title: '我的申请' }
            },

            /* ================== 录用管理 ================== */
            {
                path: 'hire/:applyId/approve',
                name: 'HireApprove',
                component: () => import('@/views/workstudy/hire/HireApprove.vue'),
                meta: { title: '录用审批' }
            },

            /* ================== 协议管理 ================== */
            {
                path: 'agreement',
                name: 'AgreementList',
                component: () => import('@/views/workstudy/agreement/AgreementList.vue'),
                meta: { title: '协议管理' }
            },
            {
                path: 'agreement/:agreementId/renew',
                name: 'AgreementRenew',
                component: () => import('@/views/workstudy/agreement/AgreementRenew.vue'),
                meta: { title: '协议续签' }
            },

            /* ================== 考勤管理 ================== */
            {
                path: 'attendance',
                name: 'AttendanceRecord',
                component: () => import('@/views/workstudy/attendance/AttendanceRecord.vue'),
                meta: { title: '考勤记录' }
            },
            {
                path: 'attendance/:attendanceId/confirm',
                name: 'AttendanceConfirm',
                component: () => import('@/views/workstudy/attendance/AttendanceConfirm.vue'),
                meta: { title: '考勤确认' }
            },
            {
                path: 'attendance/repair',
                name: 'AttendanceRepair',
                component: () => import('@/views/workstudy/attendance/AttendanceRepair.vue'),
                meta: { title: '补打卡申请' }
            },

            /* ================== 薪酬管理 ================== */
            {
                path: 'salary',
                name: 'SalaryList',
                component: () => import('@/views/workstudy/salary/SalaryList.vue'),
                meta: { title: '薪酬管理' }
            },
            {
                path: 'salary/calculate',
                name: 'SalaryCalculate',
                component: () => import('@/views/workstudy/salary/SalaryCalculate.vue'),
                meta: { title: '薪酬核算' }
            },
            {
                path: 'salary/:salaryId/dept-confirm',
                name: 'SalaryDeptConfirm',
                component: () => import('@/views/workstudy/salary/SalaryDeptConfirm.vue'),
                meta: { title: '薪酬部门确认' }
            },
            {
                path: 'salary/:salaryId/school-approve',
                name: 'SalarySchoolApprove',
                component: () => import('@/views/workstudy/salary/SalarySchoolApprove.vue'),
                meta: { title: '薪酬学校审批' }
            },

            /* ================== 评价管理 ================== */
            {
                path: 'evaluation/submit',
                name: 'EvaluationSubmit',
                component: () => import('@/views/workstudy/evaluation/EvaluationSubmit.vue'),
                meta: { title: '提交评价' }
            },
            {
                path: 'evaluation/history/:studentId',
                name: 'EvaluationHistory',
                component: () => import('@/views/workstudy/evaluation/EvaluationHistory.vue'),
                meta: { title: '评价历史' }
            }
        ]
    }
]

export default workstudyRoutes