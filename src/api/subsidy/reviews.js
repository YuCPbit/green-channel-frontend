import { apiRequest } from '../request'

/**
 * 提交审核
 */
export async function submitReview(data) {
    return apiRequest.post('/subsidy/reviews', data)
}