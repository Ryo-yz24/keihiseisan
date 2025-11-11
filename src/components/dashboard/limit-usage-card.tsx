'use client'

interface LimitUsageCardProps {
  limitUsage: {
    used: number
    limit: number
    percentage: number
  }
}

export function LimitUsageCard({ limitUsage }: LimitUsageCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    if (percentage >= 70) return 'bg-orange-500'
    return 'bg-green-500'
  }

  const getStatusText = (percentage: number) => {
    if (percentage >= 100) return '限度額到達'
    if (percentage >= 80) return '注意が必要'
    if (percentage >= 70) return '残り30%'
    return '正常'
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600'
    if (percentage >= 80) return 'text-yellow-600'
    if (percentage >= 70) return 'text-orange-600'
    return 'text-green-600'
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          経費限度額使用状況
        </h3>
        
        <div className="space-y-4">
          {/* 使用金額と限度額 */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500">使用金額</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(limitUsage.used)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500">限度額</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(limitUsage.limit)}
              </p>
            </div>
          </div>

          {/* プログレスバー */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">使用率</span>
              <span className={`font-medium ${getStatusColor(limitUsage.percentage)}`}>
                {limitUsage.percentage.toFixed(1)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(limitUsage.percentage)}`}
                style={{ width: `${Math.min(limitUsage.percentage, 100)}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className={`font-medium ${getStatusColor(limitUsage.percentage)}`}>
                {getStatusText(limitUsage.percentage)}
              </span>
              <span className="text-gray-500">
                残り: {formatCurrency(Math.max(0, limitUsage.limit - limitUsage.used))}
              </span>
            </div>
          </div>

          {/* アラート表示 */}
          {limitUsage.percentage >= 70 && (
            <div className={`p-3 rounded-md ${
              limitUsage.percentage >= 100 
                ? 'bg-red-50 border border-red-200' 
                : limitUsage.percentage >= 80
                ? 'bg-yellow-50 border border-yellow-200'
                : 'bg-orange-50 border border-orange-200'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className={`h-5 w-5 ${
                    limitUsage.percentage >= 100 
                      ? 'text-red-400' 
                      : limitUsage.percentage >= 80
                      ? 'text-yellow-400'
                      : 'text-orange-400'
                  }`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    limitUsage.percentage >= 100 
                      ? 'text-red-800' 
                      : limitUsage.percentage >= 80
                      ? 'text-yellow-800'
                      : 'text-orange-800'
                  }`}>
                    {limitUsage.percentage >= 100 
                      ? '経費限度額に達しました'
                      : limitUsage.percentage >= 80
                      ? '経費限度額の80%を超えています'
                      : '経費限度額の70%を超えています'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



