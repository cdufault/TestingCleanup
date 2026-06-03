import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../data/store'; // Adjust according to your store structure
import { setTotalCards } from '../../pages/LandingPage/landingPageSlice';
import './Carousel.css';

interface CarouselProps {
    cards: JSX.Element[];
}

const Carousel: React.FC<CarouselProps> = ({ cards }) => {
    const dispatch = useDispatch();
    const { currentIndex } = useSelector((state: RootState) => state.landingPage);

    useEffect(() => {
        dispatch(setTotalCards(cards.length));
    }, [cards, dispatch]);

    return (
        <div className='carousel-container'>
            <div className='carousel-content'>{cards[currentIndex]}</div>
        </div>
    );
};

export default Carousel;
