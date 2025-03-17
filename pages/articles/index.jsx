import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { isMultiLanguage } from '../../lib/isMultiLanguage.js';
import { sortDate } from '@pantheon-systems/nextjs-kit';
import {
	getCurrentLocaleStore,
	globalDrupalStateStores,
} from '../../lib/stores';

import { ArticleGrid } from '../../components/grid';
import PageHeader from '../../components/page-header';
import Layout from '../../components/layout';

export default function SSRArticlesListTemplate({
	sortedArticles,
	footerMenu,
	hrefLang,
	multiLanguage,
}) {
	const { locale } = useRouter();
	return (
		<Layout footerMenu={footerMenu}>
			<NextSeo
				title="Decoupled Next Drupal Demo"
				description="Generated by create-pantheon-decoupled-kit."
				languageAlternates={hrefLang || false}
			/>
			<PageHeader title="Articles" />
			<section>
				<ArticleGrid
					data={sortedArticles}
					contentType="articles"
					multiLanguage={multiLanguage}
					locale={locale}
				/>
			</section>
		</Layout>
	);
}

export async function getServerSideProps(context) {
	try {
		const origin = process.env.NEXT_PUBLIC_FRONTEND_URL;
		const { locale, locales } = context;
		// if there is more than one language in context.locales,
		// assume multilanguage is enabled.
		const multiLanguage = isMultiLanguage(locales);
		const hrefLang = locales.map((locale) => {
			return {
				hrefLang: locale,
				href: origin + '/' + locale,
			};
		});

		const store = getCurrentLocaleStore(locale, globalDrupalStateStores);

		const articles = await store.getObject({
			objectName: 'node--article',
			res: context.res,
			refresh: true,
			params: 'include=field_media_image.field_media_image',
			anon: true,
		});

		const footerMenu = await store.getObject({
			objectName: 'menu_items--main',
			res: context.res,
			refresh: true,
			anon: true,
		});

		if (!articles) {
			throw new Error(
				'No articles returned. Make sure the objectName and params are valid!',
			);
		}

		const sortedArticles = sortDate({
			data: articles,
			key: 'changed',
			direction: 'desc',
		});

		return {
			props: {
				sortedArticles,
				hrefLang,
				multiLanguage,
				footerMenu,
			},
		};
	} catch (error) {
		console.error('Unable to fetch data for article page: ', error);
		return {
			notFound: true,
		};
	}
}
