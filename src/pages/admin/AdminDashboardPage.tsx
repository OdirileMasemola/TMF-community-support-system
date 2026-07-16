import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionReveal } from "@/components/ui/SectionReveal";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { NotificationCard } from "@/components/dashboard/NotificationCard";
import { PendingActionCard } from "@/components/dashboard/PendingActionCard";
import { PerformanceCard } from "@/components/dashboard/PerformanceCard";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { SectionTitle } from "@/components/dashboard/SectionTitle";
import { StatisticCard } from "@/components/dashboard/StatisticCard";
import {
  dashboardNotifications,
  dashboardStatistics,
  pendingActions,
  performanceMetrics,
  quickActions,
  recentActivities,
  systemSummaryMetrics,
  welcomeSummary,
} from "@/data/adminDashboardData";

function formatTodayDate() {
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

export function AdminDashboardPage() {
  const today = formatTodayDate();

  return (
    <div className="space-y-8 lg:space-y-10">
      <SectionReveal>
        <DashboardHeader
          label="ADMINISTRATOR"
          title="Dashboard Overview"
          subtitle="Monitor foundation activities, community support programmes, donations, volunteers, sponsorships, and operational performance from one central dashboard."
          primaryActionLabel="Create Campaign"
          secondaryActionLabel="Generate Report"
        />
      </SectionReveal>

      <SectionReveal delay={0.05}>
        <Card className="border-border bg-card/70 backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Today</p>
          <h2 className="mt-2 text-xl font-bold text-foreground md:text-2xl">{welcomeSummary.greeting}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{today}</p>

          <div className="mt-4 space-y-1">
            {welcomeSummary.operationalSummary.map((line) => (
              <p key={line} className="text-sm leading-6 text-muted-foreground">
                {line}
              </p>
            ))}
          </div>
        </Card>
      </SectionReveal>

      <SectionReveal delay={0.1}>
        <section aria-labelledby="statistics-heading">
          <h2 id="statistics-heading" className="mb-5 text-xl font-bold text-foreground md:text-2xl">
            Quick Statistics
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardStatistics.map((stat) => (
              <StatisticCard
                key={stat.id}
                title={stat.title}
                value={stat.value}
                trend={stat.trend}
                icon={stat.icon}
              />
            ))}
          </div>
        </section>
      </SectionReveal>

      <SectionReveal delay={0.15}>
        <section aria-labelledby="activity-overview-heading">
          <SectionTitle title="Foundation Activity Overview" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="bg-card/70 backdrop-blur-xl">
              <h3 id="activity-overview-heading" className="text-lg font-semibold text-foreground">
                Recent Activities
              </h3>
              <div className="mt-4">
                {recentActivities.map((activity) => (
                  <RecentActivityCard
                    key={activity.id}
                    title={activity.title}
                    description={activity.description}
                    timestamp={activity.timestamp}
                    icon={activity.icon}
                  />
                ))}
              </div>
            </Card>

            <Card className="bg-card/70 backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-foreground">System Summary</h3>
              <div className="mt-6 space-y-5">
                {systemSummaryMetrics.map((metric) => (
                  <div key={metric.id}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">{metric.label}</p>
                      <span className="text-sm font-semibold text-primary">{metric.progress}%</span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-valuenow={metric.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={metric.label}
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${metric.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
      </SectionReveal>

      <SectionReveal delay={0.2}>
        <section aria-labelledby="pending-actions-heading">
          <SectionTitle title="Items Requiring Attention" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pendingActions.map((action) => (
              <PendingActionCard
                key={action.id}
                title={action.title}
                count={action.count}
                priority={action.priority}
              />
            ))}
          </div>
        </section>
      </SectionReveal>

      <SectionReveal delay={0.25}>
        <section aria-labelledby="quick-actions-heading">
          <SectionTitle title="Quick Actions" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => (
              <QuickActionCard
                key={action.id}
                title={action.title}
                description={action.description}
                icon={action.icon}
                route={action.route}
              />
            ))}
          </div>
        </section>
      </SectionReveal>

      <SectionReveal delay={0.3}>
        <section aria-labelledby="performance-heading">
          <SectionTitle title="Foundation Performance Snapshot" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {performanceMetrics.map((metric) => (
              <PerformanceCard
                key={metric.id}
                title={metric.title}
                percentage={metric.percentage}
                description={metric.description}
                trend={metric.trend}
                trendLabel={metric.trendLabel}
              />
            ))}
          </div>
        </section>
      </SectionReveal>

      <SectionReveal delay={0.35}>
        <section aria-labelledby="notifications-heading">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="notifications-heading" className="text-xl font-bold text-foreground md:text-2xl">
                Recent Notifications
              </h2>
            </div>
            <Button type="button" variant="outline" size="sm" aria-label="View all notifications">
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {dashboardNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                title={notification.title}
                timestamp={notification.timestamp}
                unread={notification.unread}
                icon={notification.icon}
              />
            ))}
          </div>
        </section>
      </SectionReveal>

      <SectionReveal delay={0.4}>
        <Card className="border-border bg-card/70 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-foreground">Administrator Reminder</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Review pending applications and donation verifications regularly to ensure community support
            activities continue without unnecessary delays.
          </p>
        </Card>
      </SectionReveal>
    </div>
  );
}
