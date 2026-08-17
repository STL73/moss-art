import Hero from '../sections/Hero';
import FeaturedProducts from '../sections/FeaturedProducts';
import Story from '../sections/Story';

// A photo band was trialled between the grid and the story and removed: with
// Story now a full-bleed photograph, the band butted straight into it and the
// two read as one long, unbroken image. The page's photography budget is spent
// on the hero and the story.
const Home = () => (
    <>
        <Hero />
        <FeaturedProducts />
        <Story />
    </>
);

export default Home;
